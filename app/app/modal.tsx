import { Anchor, Paragraph, View, XStack } from 'tamagui'

export default function ModalScreen() {
  return (
    <View flex={1} alignItems="center" justifyContent="center">
      <XStack gap="$2">
        <Paragraph textAlign="center">Made by</Paragraph>
        <Anchor color="$info" href="https://twitter.com/natebirdman" target="_blank">
          @natebirdman,
        </Anchor>
        <Anchor
          color="$accent"
          href="https://github.com/tamagui/tamagui"
          target="_blank"
          rel="noreferrer"
        >
          give it a ⭐️
        </Anchor>
      </XStack>
    </View>
  )
}
