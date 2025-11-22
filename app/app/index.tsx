import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button, Card, H2, H3, Input, Paragraph, XStack, YStack, Separator, Spinner, ScrollView, Circle, Text } from 'tamagui'
import { Users, Play, Crown, UserX, Copy, LogOut, Check, AlertCircle, Link as LinkIcon } from '@tamagui/lucide-icons'
import * as Clipboard from 'expo-clipboard'
import * as Linking from 'expo-linking'
import { useToastController } from '@tamagui/toast'
import { ResponsiveContainer } from 'components/ResponsiveContainer'
import { GameHeader } from 'components/GameHeader'
import { useGameClient } from 'utils/gameClient'
import { useResponsive, useResponsiveIconSize } from 'hooks/useResponsive'
import type { GameState, Player, LobbyInfo, PlayingCard as EngineCard, HandUpdatePayload } from 'types/game'
import { useRouter } from 'expo-router'
import GameTable from './game-table'
import type { TablePlayer } from 'components/game-table/types'

// Configure your PartyKit host here
const PARTYKIT_HOST = process.env.EXPO_PUBLIC_PARTYKIT_HOST || 'http://192.168.1.173:1999'

type ScreenMode = 'home' | 'create' | 'join' | 'lobby' | 'game'

const getFallbackAvatar = (index: number) => `P${index + 1}`

export default function LandingScreen() {
  const router = useRouter()
  const { isMobile } = useResponsive()
  const iconSizes = useResponsiveIconSize()

  const [mode, setMode] = useState<ScreenMode>('home')
  const [roomId, setRoomId] = useState<string>('default')
  const [playerName, setPlayerName] = useState('')
  const [lobbyCode, setLobbyCode] = useState('')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentPlayerId, setCurrentPlayerId] = useState('')
  const [playerHand, setPlayerHand] = useState<EngineCard[]>([])
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isCodeFromLink, setIsCodeFromLink] = useState(false)
  const [serverPlayableCardIds, setServerPlayableCardIds] = useState<string[]>([])
  const [celebrationState, setCelebrationState] = useState<{ round: number; triggered: boolean }>({ round: 0, triggered: false })
  const toast = useToastController()

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const data = Linking.parse(event.url)
      if (data.queryParams?.code) {
        setLobbyCode(data.queryParams.code as string)
        setIsCodeFromLink(true)
        setMode('join')
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url })
      }
    })

    const subscription = Linking.addEventListener('url', handleDeepLink)
    return () => {
      subscription.remove()
    }
  }, [])

  // Initialize game client with dynamic roomId
  const { 
    client, 
    isConnected, 
    createLobby, 
    joinLobby, 
    leaveLobby, 
    startGame, 
    kickPlayer, 
    playCard, 
    submitBid, 
    on, 
    off 
  } = useGameClient(PARTYKIT_HOST, roomId)

  // Handle connection events and game state
  useEffect(() => {
    if (!client) return

    const handleConnected = () => {
      console.log('[Multiplayer] Connected to server', roomId)
      // If we are in create mode and just connected to a new room, create the lobby
      if (mode === 'create' && roomId !== 'default') {
        console.log('[Multiplayer] Creating lobby in room:', roomId)
        createLobby(playerName, 10)
      }
      // If we are in join mode and just connected, join the lobby
      if (mode === 'join' && roomId !== 'default') {
        console.log('[Multiplayer] Joining lobby in room:', roomId)
        joinLobby(roomId, playerName)
      }
    }

    const handleLobbyCreated = (data: unknown) => {
      console.log('[Multiplayer] Lobby created:', data)
      const lobby = data as LobbyInfo
      setLobbyCode(lobby.code)
      setCurrentPlayerId(lobby.hostId)
      
      // Optimistically update game state with host to ensure immediate feedback
      const hostPlayer: Player = {
        id: lobby.hostId,
        name: lobby.hostName,
        status: 'connected',
        score: 0,
        handCount: 0,
        bid: null,
        tricksWon: 0,
        isHost: true,
        joinedAt: Date.now()
      }
      
      setGameState({
        lobbyCode: lobby.code,
        hostId: lobby.hostId,
        players: [hostPlayer],
        maxPlayers: lobby.maxPlayers,
        status: 'lobby',
        createdAt: lobby.createdAt,
        startedAt: null,
        currentTurn: null,
        round: 0,
        phase: 'idle',
        handSize: 0,
        trump: null,
        bids: {},
        tricksWon: {},
        currentTrick: [],
        pendingAction: 'none',
        deckCount: 0,
        lastTrickWinner: null,
        history: [],
        handSequence: [],
      })

      setPlayerHand([])
      setIsLoading(false)
      setServerPlayableCardIds([])
      setSuccessMessage('Lobby created successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setMode('lobby')
    }

    const handleLobbyJoined = (data: unknown) => {
      console.log('[Multiplayer] Lobby joined:', data)
      const state = data as GameState
      setGameState(state)
      setLobbyCode(state.lobbyCode)
      // Find current player ID (last player in list is the one who just joined)
      if (state.players.length > 0) {
        const myPlayer = state.players.find(p => p.name === playerName && p.status === 'connected')
        if (myPlayer) {
            setCurrentPlayerId(myPlayer.id)
        } else {
            // Fallback
            setCurrentPlayerId(state.players[state.players.length - 1].id)
        }
      }
      setIsLoading(false)
      setPlayerHand([])
      setServerPlayableCardIds([])
      setCelebrationState({ round: 0, triggered: false })
      setSuccessMessage('Joined lobby successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setMode('lobby')
    }

    const handleGameState = (data: unknown) => {
      const state = data as GameState
      setGameState(state)
      if (state.status === 'playing' && mode === 'lobby') {
        setMode('game')
      }
    }

    const handleHandUpdate = (data: unknown) => {
      const payload = data as HandUpdatePayload
      if (!payload || !Array.isArray(payload.cards)) {
        return
      }

      if (!currentPlayerId) {
        setCurrentPlayerId(payload.playerId)
      }

      if (!currentPlayerId || payload.playerId === currentPlayerId) {
        setPlayerHand(payload.cards as EngineCard[])
        const playableIds = Array.isArray(payload.playableCardIds)
          ? payload.playableCardIds.filter(id => payload.cards.some(card => card.id === id))
          : []
        setServerPlayableCardIds(playableIds)
      }
    }

    const handlePlayerKicked = (data: unknown) => {
      const kickData = data as { playerId: string }
      if (kickData.playerId === currentPlayerId) {
        console.log('[Multiplayer] You were kicked from the lobby')
        setError('You were removed from the lobby by the host')
        setTimeout(() => {
          resetState()
        }, 2000)
      }
    }

    const handleError = (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unexpected multiplayer error'
      console.error('[Multiplayer] Error:', message, err)
      // If error happens during join/create, reset
      if (isLoading) {
        setIsLoading(false)
      }
      setError(message)
    }

    on('connected', handleConnected)
    on('lobby_created', handleLobbyCreated)
    on('lobby_joined', handleLobbyJoined)
    on('game_state', handleGameState)
    on('hand_update', handleHandUpdate)
    on('player_kicked', handlePlayerKicked)
    on('error', handleError)

    return () => {
      off('connected', handleConnected)
      off('lobby_created', handleLobbyCreated)
      off('lobby_joined', handleLobbyJoined)
      off('game_state', handleGameState)
      off('hand_update', handleHandUpdate)
      off('player_kicked', handlePlayerKicked)
      off('error', handleError)
    }
  }, [client, mode, roomId, playerName, currentPlayerId, createLobby, joinLobby, on, off, isLoading])

  const resetState = () => {
    setMode('home')
    setRoomId('default')
    setGameState(null)
    setLobbyCode('')
    setError('')
    setPlayerHand([])
    setCelebrationState({ round: 0, triggered: false })
    setServerPlayableCardIds([])
    setCelebrationState({ round: 0, triggered: false })
    setIsLoading(false)
  }

  const handleCreateLobby = () => {
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }
    setIsLoading(true)
    setError('')
    setGameState(null)
    // Generate a random room ID for the new lobby
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomId(newRoomId)
    // The useEffect will trigger createLobby when connected
  }

  const handleJoinLobby = () => {
    if (!playerName.trim() || !lobbyCode.trim()) {
      setError('Please enter name and lobby code')
      return
    }
    setIsLoading(true)
    setError('')
    setGameState(null)
    // Connect to the specific room ID
    setRoomId(lobbyCode.toUpperCase())
    // The useEffect will trigger joinLobby when connected
  }

  const handleLeaveLobby = () => {
    leaveLobby()
    resetState()
  }

  const handleStartGame = () => {
    startGame()
  }

  const handleKickPlayer = (playerId: string) => {
    kickPlayer(playerId)
  }

  const copyLobbyCode = async () => {
    await Clipboard.setStringAsync(lobbyCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const getLobbyLink = () => {
    return Linking.createURL('/', {
      queryParams: { code: lobbyCode },
    })
  }

  const copyLobbyLink = async () => {
    const link = getLobbyLink()
    await Clipboard.setStringAsync(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const isHost = gameState?.hostId === currentPlayerId
  const canStartGame = gameState && gameState.players.length >= 2

  const tablePlayers = useMemo<TablePlayer[]>(() => {
    if (!gameState || gameState.players.length === 0) {
      return []
    }

    const ordered = [...gameState.players]
    ordered.sort((a, b) => {
      if (currentPlayerId) {
        if (a.id === currentPlayerId) return -1
        if (b.id === currentPlayerId) return 1
      }
      return a.joinedAt - b.joinedAt
    })

    return ordered.map((player, index) => {
      const displayName = player.name ? player.name.toUpperCase() : `PLAYER ${index + 1}`
      const baseCoins = 0
      const coinsBoost = Math.max(player.score, 0) * 10_000
      const visibleHandCount = player.id === currentPlayerId ? playerHand.length || player.handCount : player.handCount

      return {
        id: player.id,
        avatar: player.avatar ?? getFallbackAvatar(index),
        displayName,
        coins: baseCoins + coinsBoost,
        isCurrentTurn: gameState.currentTurn ? player.id === gameState.currentTurn : player.id === currentPlayerId,
        bid: gameState.bids[player.id] ?? player.bid ?? null,
        tricksWon: gameState.tricksWon[player.id] ?? player.tricksWon ?? 0,
        score: player.score,
        status: player.status,
        handCount: visibleHandCount,
        isHost: player.isHost,
        isSelf: player.id === currentPlayerId,
      }
    })
  }, [gameState, currentPlayerId, playerHand])

  const myPlayer = useMemo(() => {
    if (!gameState || !currentPlayerId) {
      return null
    }
    return gameState.players.find(player => player.id === currentPlayerId) ?? null
  }, [gameState, currentPlayerId])

  const myBid = useMemo(() => {
    if (!currentPlayerId || !gameState) {
      return null
    }
    if (gameState.bids[currentPlayerId] !== undefined) {
      return gameState.bids[currentPlayerId]
    }
    return myPlayer?.bid ?? null
  }, [currentPlayerId, gameState, myPlayer])

  const myTricksWon = useMemo(() => {
    if (!currentPlayerId || !gameState) {
      return 0
    }
    if (gameState.tricksWon[currentPlayerId] !== undefined) {
      return gameState.tricksWon[currentPlayerId] ?? 0
    }
    return myPlayer?.tricksWon ?? 0
  }, [currentPlayerId, gameState, myPlayer])

  const isMyTurn = Boolean(gameState?.currentTurn && gameState.currentTurn === currentPlayerId)

  const fallbackPlayableCardIds = useMemo(() => {
    if (!playerHand.length) {
      return []
    }

    if (!gameState || gameState.phase !== 'playing') {
      return playerHand.map(card => card.id)
    }

    const leadSuit = gameState.currentTrick[0]?.card.suit
    if (!leadSuit) {
      return playerHand.map(card => card.id)
    }

    const hasLeadSuit = playerHand.some(card => card.suit === leadSuit)
    if (!hasLeadSuit) {
      return playerHand.map(card => card.id)
    }

    return playerHand.filter(card => card.suit === leadSuit).map(card => card.id)
  }, [playerHand, gameState])

  const playableCardIds = useMemo(() => {
    if (serverPlayableCardIds.length > 0) {
      const allowed = new Set(playerHand.map(card => card.id))
      return serverPlayableCardIds.filter(id => allowed.has(id))
    }
    return fallbackPlayableCardIds
  }, [serverPlayableCardIds, playerHand, fallbackPlayableCardIds])

  useEffect(() => {
    if (!gameState) {
      return
    }
    setCelebrationState(prev => (prev.round === gameState.round ? prev : { round: gameState.round, triggered: false }))
  }, [gameState?.round])

  useEffect(() => {
    if (!gameState || celebrationState.triggered || !toast) {
      return
    }
    if (gameState.phase === 'bidding') {
      return
    }
    if (myBid === null) {
      return
    }

    const metPositiveBid = myBid > 0 && myTricksWon >= myBid
    const metZeroBid = myBid === 0 && ['round_end', 'completed', 'scoring'].includes(gameState.phase) && myTricksWon === 0
    if (!metPositiveBid && !metZeroBid) {
      return
    }

    toast.show('Contract Secured!', {
      message: myBid === 0 ? 'You dodged every trick for a perfect zero bid.' : `You hit ${myBid} ${myBid === 1 ? 'trick' : 'tricks'}!`,
      duration: 4000,
    })
    setCelebrationState(prev => ({ ...prev, triggered: true }))
  }, [gameState, myBid, myTricksWon, celebrationState.triggered, toast])

  const handleSubmitBid = useCallback((amount: number) => {
    if (
      Number.isNaN(amount) ||
      amount < 0 ||
      !isConnected ||
      !gameState ||
      gameState.phase !== 'bidding' ||
      gameState.pendingAction !== 'bid' ||
      !isMyTurn
    ) {
      return
    }
    submitBid(amount)
  }, [gameState, isConnected, isMyTurn, submitBid])

  const handlePlayCard = useCallback((cardId: string) => {
    if (
      !cardId ||
      !isConnected ||
      !gameState ||
      gameState.phase !== 'playing' ||
      gameState.pendingAction !== 'play' ||
      !isMyTurn
    ) {
      return
    }
    if (playableCardIds.length && !playableCardIds.includes(cardId)) {
      return
    }
    playCard(cardId)
  }, [gameState, isConnected, isMyTurn, playableCardIds, playCard])

  // Home Screen
  if (mode === 'home') {
    return (
      <ResponsiveContainer key="home" bg="$background">
        <GameHeader />
        <YStack flex={1} alignItems="center" justifyContent="center" px={isMobile ? '$3' : '$4'} gap="$4">
          <YStack alignItems="center" gap="$2">
            <Crown size={iconSizes.xl} color="$primary" />
            <H2 color="$primary" fontWeight="bold">Card Masters</H2>
            <Paragraph color="$colorHover">Multiplayer Lobby</Paragraph>
          </YStack>

          <YStack gap="$3" width="100%" style={{ maxWidth: 300 }}>
            <Button
              size={isMobile ? '$4' : '$5'}
              bg="$primary"
              icon={<Play size={iconSizes.sm} />}
              onPress={() => setMode('create')}
              pressStyle={{ scale: 0.97 }}
              hoverStyle={{ scale: 1.02 }}
              animation="bouncy"
            >
              Create Lobby
            </Button>

            <Button
              size={isMobile ? '$4' : '$5'}
              bg="$secondary"
              icon={<Users size={iconSizes.sm} />}
              onPress={() => setMode('join')}
              pressStyle={{ scale: 0.97 }}
              hoverStyle={{ scale: 1.02 }}
              animation="bouncy"
            >
              Join Lobby
            </Button>

            <Button
              size={isMobile ? '$4' : '$5'}
              bg="$accent"
              icon={<Play size={iconSizes.sm} />}
              onPress={() => router.push('/game-table')}
              pressStyle={{ scale: 0.97 }}
              hoverStyle={{ scale: 1.02 }}
              animation="bouncy"
            >
              Test Game Table
            </Button>
          </YStack>
          
          {!isConnected && (
             <Paragraph color="$error" fontSize="$2">Connecting to server...</Paragraph>
          )}
        </YStack>
      </ResponsiveContainer>
    )
  }

  // Create Lobby Screen
  if (mode === 'create') {
    return (
      <ResponsiveContainer key="create" bg="$background">
        <GameHeader />
        <YStack flex={1} alignItems="center" justifyContent="center" px={isMobile ? '$3' : '$4'} gap="$4">
          <Card elevate bordered p={isMobile ? '$4' : '$6'} width="100%" maxWidth={400}>
            <YStack gap="$4">
              <YStack alignItems="center" gap="$2">
                <Crown size={iconSizes.xl} color="$primary" />
                <H2 color="$primary">Create Lobby</H2>
                <Paragraph color="$colorHover">
                  Start a new game as host
                </Paragraph>
              </YStack>

              <YStack gap="$3">
                <Input
                  placeholder="Enter your name"
                  value={playerName}
                  onChangeText={setPlayerName}
                  size={isMobile ? '$4' : '$5'}
                  bg="$background"
                />
              </YStack>

              {error ? (
                <Card bg="$backgroundHover" borderColor="$error" bordered p="$2" animation="medium">
                  <XStack alignItems="center" gap="$2">
                    <AlertCircle size={iconSizes.xs} color="$error" />
                    <Paragraph color="$error" fontSize="$3" flex={1}>{error}</Paragraph>
                  </XStack>
                </Card>
              ) : null}

              <YStack gap="$2">
                <Button
                  size={isMobile ? '$4' : '$5'}
                  bg="$primary"
                  icon={isLoading ? <Spinner color="white" /> : <Play size={iconSizes.sm} />}
                  onPress={handleCreateLobby}
                  disabled={!playerName.trim() || isLoading}
                  pressStyle={{ scale: 0.97 }}
                  hoverStyle={{ scale: 1.02 }}
                  animation="bouncy"
                  opacity={!playerName.trim() || isLoading ? 0.5 : 1}
                >
                  {isLoading ? 'Creating...' : 'Create Lobby'}
                </Button>

                <Button
                  size={isMobile ? '$4' : '$5'}
                  bg="$backgroundStrong"
                  onPress={() => setMode('home')}
                  pressStyle={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  Back
                </Button>
              </YStack>
            </YStack>
          </Card>
        </YStack>
      </ResponsiveContainer>
    )
  }

  // Join Lobby Screen
  if (mode === 'join') {
    return (
      <ResponsiveContainer key="join" bg="$background">
        <GameHeader />
        <YStack flex={1} alignItems="center" justifyContent="center" px={isMobile ? '$3' : '$4'} gap="$4">
          <Card elevate bordered p={isMobile ? '$4' : '$6'} width="100%" maxWidth={400}>
            <YStack gap="$4">
              <YStack alignItems="center" gap="$2">
                <Users size={iconSizes.xl} color="$secondary" />
                <H2 color="$primary">Join Lobby</H2>
                <Paragraph color="$colorHover">
                  Enter the 6-character code
                </Paragraph>
              </YStack>

              <YStack gap="$3">
                <Input
                  placeholder="Enter your name"
                  value={playerName}
                  onChangeText={setPlayerName}
                  size={isMobile ? '$4' : '$5'}
                  bg="$background"
                />
                <Input
                  placeholder="Lobby Code (e.g. ABC123)"
                  value={lobbyCode}
                  onChangeText={(text) => setLobbyCode(text.toUpperCase())}
                  size={isMobile ? '$4' : '$5'}
                  bg="$background"
                  autoCapitalize="characters"
                  maxLength={6}
                  disabled={isCodeFromLink}
                  opacity={isCodeFromLink ? 0.5 : 1}
                />
              </YStack>

              {error ? (
                <Card bg="$backgroundHover" borderColor="$error" bordered p="$2" animation="medium">
                  <XStack alignItems="center" gap="$2">
                    <AlertCircle size={iconSizes.xs} color="$error" />
                    <Paragraph color="$error" fontSize="$3" flex={1}>{error}</Paragraph>
                  </XStack>
                </Card>
              ) : null}

              <YStack gap="$2">
                <Button
                  size={isMobile ? '$4' : '$5'}
                  bg="$secondary"
                  icon={isLoading ? <Spinner color="white" /> : <Users size={iconSizes.sm} />}
                  onPress={handleJoinLobby}
                  disabled={!playerName.trim() || !lobbyCode.trim() || isLoading}
                  pressStyle={{ scale: 0.97 }}
                  hoverStyle={{ scale: 1.02 }}
                  animation="bouncy"
                  opacity={!playerName.trim() || !lobbyCode.trim() || isLoading ? 0.5 : 1}
                >
                  {isLoading ? 'Joining...' : 'Join Lobby'}
                </Button>

                <Button
                  size={isMobile ? '$4' : '$5'}
                  bg="$backgroundStrong"
                  onPress={() => setMode('home')}
                  pressStyle={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  Back
                </Button>
              </YStack>
            </YStack>
          </Card>
        </YStack>
      </ResponsiveContainer>
    )
  }

  // Lobby Screen - Waiting for players
  if (mode === 'lobby' && gameState) {
    return (
      <ResponsiveContainer key="lobby" bg="$background">
        <GameHeader />
        <YStack flex={1} px={isMobile ? '$3' : '$4'} py="$3" gap="$3" width="100%" style={{ maxWidth: 800, alignSelf: 'center' }}>
          {/* Success Message */}
          {successMessage ? (
            <Card bg="$backgroundHover" borderColor="$secondary" bordered p="$3" animation="medium" enterStyle={{ opacity: 0, y: -10 }} exitStyle={{ opacity: 0, y: -10 }}>
              <XStack alignItems="center" gap="$2">
                <Check size={iconSizes.sm} color="$secondary" />
                <Paragraph color="$secondary" fontSize="$4" fontWeight="bold" flex={1}>{successMessage}</Paragraph>
              </XStack>
            </Card>
          ) : null}

          {/* Main Lobby Content - Split for Desktop, Stack for Mobile */}
          <YStack gap="$3" flex={1}>
            
            {/* Top Section: Code & Info */}
            <Card elevate bordered bg="$primary" p="$3" animation="bouncy" enterStyle={{ opacity: 0, scale: 0.95, y: 10 }}>
              <YStack gap="$3">
                <XStack alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center" gap="$2">
                    <Crown size={20} color="$accent" />
                    <H3 color="white" fontWeight="800" fontSize="$5">Game Lobby</H3>
                  </XStack>
                  <Card bg="rgba(0,0,0,0.2)" px="$2" py="$1" borderRadius="$4">
                     <Paragraph color="white" opacity={0.9} fontSize={10} fontWeight="bold" letterSpacing={0.5}>WAITING FOR PLAYERS</Paragraph>
                  </Card>
                </XStack>

                <XStack gap="$2" flexWrap="wrap">
                  {/* Code Box */}
                  <XStack flex={1} bg="rgba(0,0,0,0.2)" p="$2" alignItems="center" justifyContent="space-between" borderWidth={1} borderColor="rgba(255,255,255,0.1)" style={{ minWidth: 140, borderRadius: 12 }}>
                    <YStack>
                      <Paragraph color="white" opacity={0.6} fontSize={9} fontWeight="bold" letterSpacing={1}>CODE</Paragraph>
                      <H2 color="$accent" fontWeight="900" letterSpacing={1} fontSize="$6">{lobbyCode.slice(0, 3)}-{lobbyCode.slice(3)}</H2>
                    </YStack>
                    <Button
                      size="$2"
                      icon={copiedCode ? <Check size={14} color="$success" /> : <Copy size={14} color="white" />}
                      onPress={copyLobbyCode}
                      bg="rgba(255,255,255,0.1)"
                      hoverStyle={{ bg: "rgba(255,255,255,0.2)" }}
                      pressStyle={{ bg: "rgba(255,255,255,0.05)" }}
                    />
                  </XStack>

                  {/* Link Box */}
                  <XStack flex={1} bg="rgba(0,0,0,0.2)" p="$2" alignItems="center" justifyContent="space-between" borderWidth={1} borderColor="rgba(255,255,255,0.1)" style={{ minWidth: 140, borderRadius: 12 }}>
                    <YStack flex={1} mr="$2">
                      <Paragraph color="white" opacity={0.6} fontSize={9} fontWeight="bold" letterSpacing={1}>INVITE LINK</Paragraph>
                      <Paragraph numberOfLines={1} ellipsizeMode="middle" color="white" fontSize="$3" opacity={0.9}>
                        {getLobbyLink()}
                      </Paragraph>
                    </YStack>
                    <Button
                      size="$2"
                      icon={copiedLink ? <Check size={14} color="$success" /> : <LinkIcon size={14} color="white" />}
                      onPress={copyLobbyLink}
                      bg="rgba(255,255,255,0.1)"
                      hoverStyle={{ bg: "rgba(255,255,255,0.2)" }}
                      pressStyle={{ bg: "rgba(255,255,255,0.05)" }}
                    />
                  </XStack>
                </XStack>
              </YStack>
            </Card>

            {/* Players List */}
            <Card elevate bordered flex={1} bg="$backgroundStrong" overflow="hidden" p={0} animation="lazy" enterStyle={{ opacity: 0, y: 20 }}>
              <XStack alignItems="center" justifyContent="space-between" px="$3" py="$2" bg="$background" borderBottomWidth={1} borderColor="$borderColor">
                <XStack alignItems="center" gap="$2">
                  <Users size={18} color="$primary" />
                  <Paragraph color="$color" fontWeight="bold" fontSize="$4">Players</Paragraph>
                  <Card bg="$primary" px="$2" py="$1" borderRadius="$4">
                    <Paragraph color="white" fontSize={10} fontWeight="bold">{gameState.players.length}/{gameState.maxPlayers}</Paragraph>
                  </Card>
                </XStack>
                {isHost && (
                  <Card bg="$accent" px="$2" py="$1" borderRadius="$4">
                    <Paragraph color="$backgroundStrong" fontSize={10} fontWeight="900">HOST</Paragraph>
                  </Card>
                )}
              </XStack>
              
              <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                <YStack gap="$2" p="$2">
                  {gameState.players.map((player: Player, index: number) => {
                    const playerAvatar = player.avatar ?? getFallbackAvatar(index)
                    const avatarSize = isMobile ? 40 : 48

                    return (
                    <XStack 
                      key={player.id} 
                      alignItems="center" 
                      justifyContent="space-between" 
                      p="$2" 
                      bg={player.id === currentPlayerId ? "$primary" : "$background"}
                      borderWidth={1}
                      borderColor={player.id === currentPlayerId ? "$primary" : "$borderColor"}
                      animation="bouncy"
                      enterStyle={{ opacity: 0, x: -20, scale: 0.9 }}
                      style={{ animationDelay: `${index * 50}ms`, borderRadius: 12 }}
                      pressStyle={{ scale: 0.99 }}
                    >
                      <XStack alignItems="center" gap="$3" flex={1}>
                        <YStack position="relative" width={avatarSize} alignItems="center">
                          <Circle
                            size={avatarSize}
                            bg="rgba(241,245,249,0.95)"
                            borderWidth={1.5}
                            borderColor={player.id === currentPlayerId ? '$primary' : '$borderColor'}
                            shadowColor="#000"
                            shadowRadius={4}
                            shadowOpacity={0.2}
                          >
                            <Text fontSize={isMobile ? 20 : 24} textAlign="center">
                              {playerAvatar}
                            </Text>
                          </Circle>
                          {player.isHost && (
                            <Circle
                              size={isMobile ? 18 : 20}
                              bg="$accent"
                              position="absolute"
                              bottom={-4}
                              right={-4}
                              borderWidth={1}
                              borderColor="$background"
                              shadowColor="#000"
                              shadowRadius={3}
                              shadowOpacity={0.4}
                            >
                              <Crown size={isMobile ? 10 : 12} color="$backgroundStrong" />
                            </Circle>
                          )}
                        </YStack>
                        <YStack flex={1}>
                          <XStack alignItems="center" gap="$2">
                            <Paragraph fontWeight="bold" color={player.id === currentPlayerId ? "white" : "$color"} fontSize="$3">{player.name}</Paragraph>
                            {player.id === currentPlayerId && (
                              <Paragraph color="white" opacity={0.8} fontSize={10}>(You)</Paragraph>
                            )}
                          </XStack>
                        </YStack>
                      </XStack>
                      
                      <XStack alignItems="center" gap="$2">
                        <Circle size={8} bg={player.status === 'connected' ? "$success" : "$warning"} />
                        {isHost && !player.isHost && (
                          <Button
                            size="$2"
                            icon={<UserX size={12} />}
                            onPress={() => handleKickPlayer(player.id)}
                            bg="$error"
                            chromeless={player.id !== currentPlayerId}
                            color={player.id === currentPlayerId ? "white" : "$error"}
                            hoverStyle={{ bg: "$error" }}
                          />
                        )}
                      </XStack>
                    </XStack>
                    )
                  })}
                </YStack>
              </ScrollView>
            </Card>

            {/* Action Buttons */}
            <YStack gap="$3" pt="$2">
              {isHost ? (
                <XStack gap="$3">
                  <Button
                    flex={1}
                    size="$4"
                    bg="$background"
                    borderColor="$error"
                    borderWidth={1}
                    color="$error"
                    icon={<LogOut size={16} />}
                    onPress={handleLeaveLobby}
                    pressStyle={{ bg: "$error" }}
                    animation="bouncy"
                  >
                    Leave
                  </Button>
                  <Button
                    flex={2}
                    size="$4"
                    bg="$accent"
                    color="$backgroundStrong"
                    icon={<Play size={16} color="$backgroundStrong" />}
                    onPress={handleStartGame}
                    disabled={!canStartGame}
                    opacity={!canStartGame ? 0.5 : 1}
                    pressStyle={{ scale: 0.97 }}
                    hoverStyle={{ scale: 1.02 }}
                    animation="bouncy"
                    fontWeight="bold"
                  >
                    Start Game
                  </Button>
                </XStack>
              ) : (
                <YStack gap="$3">
                  <Card bg="$backgroundHover" p="$3" bordered borderColor="$primary" animation="medium">
                    <XStack alignItems="center" gap="$3" justifyContent="center">
                      <Spinner size="small" color="$primary" />
                      <Paragraph color="$primary" fontWeight="bold">Waiting for host to start...</Paragraph>
                    </XStack>
                  </Card>
                  <Button
                    size="$4"
                    bg="$background"
                    borderColor="$error"
                    borderWidth={1}
                    color="$error"
                    icon={<LogOut size={16} />}
                    onPress={handleLeaveLobby}
                  >
                    Leave Lobby
                  </Button>
                </YStack>
              )}
            </YStack>
          </YStack>
        </YStack>
      </ResponsiveContainer>
    )
  }

  // Game Screen - Simplified for now
  if (mode === 'game' && gameState) {
    return (
      <GameTable
        key="game"
        players={tablePlayers.length ? tablePlayers : undefined}
        playerCount={gameState.players.length}
        maxPlayers={gameState.maxPlayers}
        hand={playerHand}
        round={gameState.round}
        phase={gameState.phase}
        pendingAction={gameState.pendingAction}
        trump={gameState.trump}
        currentTrick={gameState.currentTrick}
        lastTrickWinner={gameState.lastTrickWinner}
        deckCount={gameState.deckCount}
        myBid={myBid}
        myTricksWon={myTricksWon}
        isMyTurn={isMyTurn}
        handSize={gameState.handSize}
        onSubmitBid={handleSubmitBid}
        onPlayCard={handlePlayCard}
        playableCardIds={playableCardIds}
        lobbyCode={gameState.lobbyCode}
        status={gameState.status}
        isConnected={isConnected}
        onLeaveGame={handleLeaveLobby}
      />
    )
  }

  return null
}

