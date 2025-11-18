/**
 * Main Kachuful Game Screen
 * Handles all game phases and UI rendering
 */

import { useState, useEffect } from 'react'
import { Button, Card, H1, H2, H3, Paragraph, XStack, YStack, ScrollView, Spinner, Circle, Separator } from 'tamagui'
import { Crown, Users, Trophy, Target, Heart, Diamond, Club, Spade } from '@tamagui/lucide-icons'
import { ResponsiveContainer } from '../../components/ResponsiveContainer'
import { GameHeader } from '../../components/GameHeader'
import { PlayingCard } from '../../components/kachuful/Card'
import { useKachufulGame, useCurrentPlayer, useIsMyTurn } from '../../hooks/useKachufulGame'
import { useResponsive, useResponsiveIconSize, useResponsiveFontSize } from '../../hooks/useResponsive'
import { getPlayableCards } from '../../utils/kachuful/gameLogic'
import { DEFAULT_SETTINGS } from '../../utils/kachuful/constants'
import type { Card as CardType, KachufulPhase } from '../../types/kachuful'

const PARTYKIT_HOST = process.env.EXPO_PUBLIC_PARTYKIT_HOST || 'localhost:1999'

interface KachufulGameScreenProps {
  roomId: string
  playerId: string
  playerName: string
  onLeave: () => void
}

const SUIT_ICONS = {
  hearts: Heart,
  diamonds: Diamond,
  clubs: Club,
  spades: Spade,
}

export function KachufulGameScreen({ roomId, playerId, playerName, onLeave }: KachufulGameScreenProps) {
  const { isMobile } = useResponsive()
  const iconSizes = useResponsiveIconSize()
  const fontSizes = useResponsiveFontSize()

  const { gameState, isConnected, startGame, placeBid, playCard, error } = useKachufulGame(
    PARTYKIT_HOST,
    roomId,
    playerId
  )

  const currentPlayer = useCurrentPlayer(gameState, playerId)
  const isMyTurn = useIsMyTurn(gameState, playerId)
  const isHost = currentPlayer?.isHost || false

  const [selectedBid, setSelectedBid] = useState(0)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  // Auto-start game for testing
  useEffect(() => {
    if (gameState?.phase === 'lobby' && isHost) {
      // Automatically start game after 1 second
      const timer = setTimeout(() => {
        startGame(DEFAULT_SETTINGS)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [gameState?.phase, isHost, startGame])

  if (!gameState) {
    return (
      <ResponsiveContainer>
        <GameHeader title="Kachuful" onBack={onLeave} />
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
          <Spinner size="large" color="$primary" />
          <Paragraph>Connecting to game...</Paragraph>
        </YStack>
      </ResponsiveContainer>
    )
  }

  // Render phase-specific content
  const renderPhaseContent = () => {
    switch (gameState.phase) {
      case 'lobby':
        return renderLobby()
      case 'round_start':
      case 'dealing':
        return renderRoundStart()
      case 'trump_reveal':
        return renderTrumpReveal()
      case 'bidding':
        return renderBidding()
      case 'playing':
        return renderPlaying()
      case 'trick_result':
        return renderTrickResult()
      case 'round_scoring':
        return renderRoundScoring()
      case 'scoreboard':
        return renderScoreboard()
      case 'game_end':
        return renderGameEnd()
      default:
        return <Paragraph>Unknown phase: {gameState.phase}</Paragraph>
    }
  }

  const renderLobby = () => (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
      <Crown size={iconSizes.xl} color="$accent" />
      <H1>Waiting to Start...</H1>
      <Paragraph>Players: {gameState.players.length}</Paragraph>
      {isHost && (
        <Button
          size="$6"
          theme="primary"
          onPress={() => startGame(DEFAULT_SETTINGS)}
        >
          Start Game
        </Button>
      )}
    </YStack>
  )

  const renderRoundStart = () => (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
      <H1>Round {gameState.currentRound}</H1>
      <Paragraph fontSize={fontSizes.subtitle}>
        {gameState.roundConfig.cardsPerPlayer} cards per player
      </Paragraph>
      <Spinner size="large" color="$primary" />
      <Paragraph>Dealing cards...</Paragraph>
    </YStack>
  )

  const renderTrumpReveal = () => {
    const TrumpIcon = gameState.trumpSuit ? SUIT_ICONS[gameState.trumpSuit] : null
    
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <H2>Trump Suit</H2>
        {gameState.isNoTrump ? (
          <>
            <Circle size={iconSizes.xl * 2} backgroundColor="$gray5">
              <Paragraph fontSize={fontSizes.hero}>❌</Paragraph>
            </Circle>
            <H3>No Trump!</H3>
            <Paragraph>Highest of led suit wins</Paragraph>
          </>
        ) : (
          <>
            <Circle size={iconSizes.xl * 2} backgroundColor="$primary">
              {TrumpIcon && <TrumpIcon size={iconSizes.xl} color="$pearl" />}
            </Circle>
            <H3>{gameState.trumpSuit?.toUpperCase()}</H3>
            <Paragraph>Trump beats all other suits</Paragraph>
          </>
        )}
      </YStack>
    )
  }

  const renderBidding = () => {
    const maxBid = gameState.roundConfig.cardsPerPlayer
    
    return (
      <YStack flex={1} gap="$4" padding="$4">
        <H2>Bidding Phase</H2>
        
        {/* Player's hand */}
        {currentPlayer && (
          <Card elevate bordered>
            <Card.Header padded>
              <Paragraph fontWeight="bold">Your Hand</Paragraph>
            </Card.Header>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack padding="$3" gap="$2">
                {currentPlayer.hand.map((card) => (
                  <PlayingCard
                    key={card.id}
                    card={card}
                    size="medium"
                  />
                ))}
              </XStack>
            </ScrollView>
          </Card>
        )}

        {/* Bids placed */}
        <Card elevate bordered>
          <Card.Header padded>
            <Paragraph fontWeight="bold">Bids</Paragraph>
          </Card.Header>
          <YStack padding="$3" gap="$2">
            {gameState.players.map((player) => (
              <XStack
                key={player.id}
                alignItems="center"
                justifyContent="space-between"
                backgroundColor={player.id === gameState.currentBidderId ? '$primary' : '$background'}
                padding="$2"
                borderRadius="$2"
              >
                <XStack alignItems="center" gap="$2">
                  {player.isHost && <Crown size={iconSizes.sm} color="$accent" />}
                  <Paragraph color={player.id === gameState.currentBidderId ? '$pearl' : '$color'}>
                    {player.name}
                  </Paragraph>
                </XStack>
                <Paragraph 
                  fontWeight="bold"
                  color={player.id === gameState.currentBidderId ? '$pearl' : '$color'}
                >
                  {player.bid !== null ? player.bid : '?'}
                </Paragraph>
              </XStack>
            ))}
            <Separator />
            <XStack justifyContent="space-between">
              <Paragraph>Total Bids:</Paragraph>
              <Paragraph fontWeight="bold">{gameState.totalBids} / {maxBid}</Paragraph>
            </XStack>
          </YStack>
        </Card>

        {/* Bidding controls */}
        {isMyTurn && (
          <Card elevate bordered theme="primary">
            <Card.Header padded>
              <H3 color="$pearl">Your Turn to Bid</H3>
            </Card.Header>
            <YStack padding="$3" gap="$3">
              <XStack alignItems="center" justifyContent="center" gap="$4">
                <Button
                  size="$5"
                  circular
                  onPress={() => setSelectedBid(Math.max(0, selectedBid - 1))}
                  disabled={selectedBid <= 0}
                >
                  -
                </Button>
                <YStack alignItems="center" minWidth={80}>
                  <H1 color="$pearl">{selectedBid}</H1>
                  <Paragraph color="$pearl" opacity={0.8}>tricks</Paragraph>
                </YStack>
                <Button
                  size="$5"
                  circular
                  onPress={() => setSelectedBid(Math.min(maxBid, selectedBid + 1))}
                  disabled={selectedBid >= maxBid}
                >
                  +
                </Button>
              </XStack>
              <Button
                size="$5"
                theme="secondary"
                onPress={() => {
                  placeBid(selectedBid)
                  setSelectedBid(0)
                }}
              >
                Place Bid
              </Button>
            </YStack>
          </Card>
        )}

        {error && (
          <Card backgroundColor="$red5" borderColor="$red10" borderWidth={1}>
            <Card.Header padded>
              <Paragraph color="$red11">{error}</Paragraph>
            </Card.Header>
          </Card>
        )}
      </YStack>
    )
  }

  const renderPlaying = () => {
    const playableCards = currentPlayer && gameState.currentTrick.ledSuit
      ? getPlayableCards(currentPlayer.hand, gameState.currentTrick.ledSuit, gameState.trumpSuit)
      : currentPlayer?.hand || []

    return (
      <YStack flex={1} gap="$4" padding="$4">
        <H2>Playing - Round {gameState.currentRound}</H2>
        
        {/* Trump indicator */}
        <XStack gap="$2" alignItems="center">
          <Paragraph>Trump:</Paragraph>
          {gameState.isNoTrump ? (
            <Paragraph fontWeight="bold">None</Paragraph>
          ) : (
            <Paragraph fontWeight="bold">{gameState.trumpSuit?.toUpperCase()}</Paragraph>
          )}
        </XStack>

        {/* Trick area */}
        <Card elevate bordered>
          <Card.Header padded>
            <Paragraph fontWeight="bold">
              Trick {gameState.currentTrick.number} / {gameState.roundConfig.cardsPerPlayer}
            </Paragraph>
          </Card.Header>
          <YStack padding="$4" alignItems="center" minHeight={180}>
            {gameState.currentTrick.cardsPlayed.length > 0 ? (
              <XStack gap="$2" flexWrap="wrap" justifyContent="center">
                {gameState.currentTrick.cardsPlayed.map((played) => (
                  <YStack key={played.playerId} alignItems="center" gap="$2">
                    <PlayingCard card={played.card} size="small" />
                    <Paragraph fontSize={fontSizes.caption}>{played.playerName}</Paragraph>
                  </YStack>
                ))}
              </XStack>
            ) : (
              <Paragraph opacity={0.6}>Waiting for cards...</Paragraph>
            )}
          </YStack>
        </Card>

        {/* Player hand */}
        {currentPlayer && (
          <Card elevate bordered>
            <Card.Header padded>
              <XStack justifyContent="space-between" alignItems="center">
                <Paragraph fontWeight="bold">Your Hand</Paragraph>
                <Paragraph>
                  Bid: {currentPlayer.bid} | Won: {currentPlayer.tricksWon}
                </Paragraph>
              </XStack>
            </Card.Header>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack padding="$3" gap="$2">
                {currentPlayer.hand.map((card) => {
                  const isPlayable = playableCards.some(c => c.id === card.id)
                  return (
                    <PlayingCard
                      key={card.id}
                      card={card}
                      size="medium"
                      onPress={isMyTurn && isPlayable ? () => {
                        setSelectedCard(selectedCard === card.id ? null : card.id)
                      } : undefined}
                      selected={selectedCard === card.id}
                      disabled={!isMyTurn || !isPlayable}
                    />
                  )
                })}
              </XStack>
            </ScrollView>
          </Card>
        )}

        {/* Play button */}
        {isMyTurn && selectedCard && (
          <Button
            size="$5"
            theme="primary"
            onPress={() => {
              playCard(selectedCard)
              setSelectedCard(null)
            }}
          >
            Play Card
          </Button>
        )}

        {!isMyTurn && (
          <Paragraph textAlign="center" opacity={0.7}>
            Waiting for {gameState.players.find(p => p.id === gameState.currentPlayerId)?.name}...
          </Paragraph>
        )}

        {error && (
          <Card backgroundColor="$red5" borderColor="$red10" borderWidth={1}>
            <Card.Header padded>
              <Paragraph color="$red11">{error}</Paragraph>
            </Card.Header>
          </Card>
        )}
      </YStack>
    )
  }

  const renderTrickResult = () => {
    const winner = gameState.players.find(p => p.id === gameState.currentTrick.winnerId)
    
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <Trophy size={iconSizes.xl} color="$accent" />
        <H2>{winner?.name} Wins!</H2>
        <XStack gap="$2" flexWrap="wrap" justifyContent="center">
          {gameState.currentTrick.cardsPlayed.map((played) => (
            <PlayingCard key={played.playerId} card={played.card} size="small" />
          ))}
        </XStack>
        <Paragraph>Trick {gameState.tricks.length} of {gameState.roundConfig.cardsPerPlayer}</Paragraph>
      </YStack>
    )
  }

  const renderRoundScoring = () => (
    <YStack flex={1} gap="$4" padding="$4">
      <H2 textAlign="center">Round {gameState.currentRound} Results</H2>
      
      <Card elevate bordered>
        <Card.Header padded>
          <Paragraph fontWeight="bold">Scores</Paragraph>
        </Card.Header>
        <YStack padding="$3" gap="$2">
          {gameState.players.map((player) => {
            const madeBid = player.bid === player.tricksWon
            return (
              <XStack
                key={player.id}
                justifyContent="space-between"
                alignItems="center"
                padding="$2"
                backgroundColor={madeBid ? '$green5' : '$red5'}
                borderRadius="$2"
              >
                <XStack gap="$2" alignItems="center">
                  {player.isHost && <Crown size={iconSizes.sm} color="$accent" />}
                  <Paragraph>{player.name}</Paragraph>
                </XStack>
                <XStack gap="$3" alignItems="center">
                  <Paragraph>Bid: {player.bid}</Paragraph>
                  <Paragraph>Won: {player.tricksWon}</Paragraph>
                  <Paragraph fontWeight="bold" color={madeBid ? '$green11' : '$red11'}>
                    {player.roundScore > 0 ? '+' : ''}{player.roundScore}
                  </Paragraph>
                </XStack>
              </XStack>
            )
          })}
        </YStack>
      </Card>
    </YStack>
  )

  const renderScoreboard = () => {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.totalScore - a.totalScore)
    
    return (
      <YStack flex={1} gap="$4" padding="$4">
        <H2 textAlign="center">Scoreboard</H2>
        <Paragraph textAlign="center" opacity={0.7}>
          After Round {gameState.currentRound} of {gameState.totalRounds}
        </Paragraph>
        
        <Card elevate bordered>
          <YStack padding="$3" gap="$2">
            {sortedPlayers.map((player, index) => (
              <XStack
                key={player.id}
                justifyContent="space-between"
                alignItems="center"
                padding="$3"
                backgroundColor={index === 0 ? '$primary' : '$background'}
                borderRadius="$2"
              >
                <XStack gap="$3" alignItems="center">
                  <Paragraph fontSize={fontSizes.title} fontWeight="bold">
                    {index + 1}
                  </Paragraph>
                  {player.isHost && <Crown size={iconSizes.sm} color="$accent" />}
                  <Paragraph color={index === 0 ? '$pearl' : '$color'}>
                    {player.name}
                  </Paragraph>
                </XStack>
                <Paragraph
                  fontSize={fontSizes.title}
                  fontWeight="bold"
                  color={index === 0 ? '$pearl' : '$color'}
                >
                  {player.totalScore}
                </Paragraph>
              </XStack>
            ))}
          </YStack>
        </Card>
      </YStack>
    )
  }

  const renderGameEnd = () => {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.totalScore - a.totalScore)
    const winner = sortedPlayers[0]
    
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4" padding="$4">
        <Trophy size={iconSizes.xl * 2} color="$accent" />
        <H1>{winner.name} Wins!</H1>
        <Paragraph fontSize={fontSizes.title}>{winner.totalScore} points</Paragraph>
        
        <Card elevate bordered width="100%" maxWidth={400}>
          <Card.Header padded>
            <Paragraph fontWeight="bold">Final Standings</Paragraph>
          </Card.Header>
          <YStack padding="$3" gap="$2">
            {sortedPlayers.map((player, index) => (
              <XStack
                key={player.id}
                justifyContent="space-between"
                padding="$2"
                borderRadius="$2"
              >
                <XStack gap="$2" alignItems="center">
                  <Paragraph fontWeight="bold">{index + 1}.</Paragraph>
                  <Paragraph>{player.name}</Paragraph>
                </XStack>
                <Paragraph fontWeight="bold">{player.totalScore} pts</Paragraph>
              </XStack>
            ))}
          </YStack>
        </Card>

        <Button size="$5" theme="primary" onPress={onLeave}>
          Back to Lobby
        </Button>
      </YStack>
    )
  }

  return (
    <ResponsiveContainer>
      <GameHeader
        title={`Kachuful - Round ${gameState.currentRound}`}
        onBack={onLeave}
        rightContent={
          <XStack gap="$2" alignItems="center">
            <Circle size={8} backgroundColor={isConnected ? '$secondary' : '$error'} />
            <Users size={iconSizes.sm} />
            <Paragraph>{gameState.players.length}</Paragraph>
          </XStack>
        }
      />
      <ScrollView flex={1}>
        {renderPhaseContent()}
      </ScrollView>
    </ResponsiveContainer>
  )
}
