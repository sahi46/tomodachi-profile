export interface StickerPack {
  id: string
  name: string
  preview: string
  stickers: string[]
}

export const STICKER_PACKS: StickerPack[] = [
  {
    id: 'animals',
    name: 'どうぶつ',
    preview: '🐰',
    stickers: ['🐰','🐇','🐱','🐮','🐷','🐸','🐹','🐭','🦊','🐻','🐼','🐨','🐯','🦁','🐔','🐧'],
  },
  {
    id: 'nature',
    name: 'しぜん',
    preview: '🌸',
    stickers: ['🌸','🌺','🌻','🌷','🍀','🌈','🌙','☀️','⭐','🌟','💫','✨','🍁','🌊','🌿','🌵'],
  },
  {
    id: 'food',
    name: 'たべもの',
    preview: '🍓',
    stickers: ['🍓','🍊','🍋','🍇','🍒','🍑','🥝','🍉','🍎','🍧','🍦','🧁','🍩','🍰','🎂','🍭'],
  },
  {
    id: 'kimochi',
    name: 'きもち',
    preview: '🥰',
    stickers: ['🥰','😍','😊','🤗','😘','😜','😎','🥹','😭','🤩','😴','🤭','🫶','💕','💖','💝'],
  },
  {
    id: 'kawaii',
    name: 'ゆめかわ',
    preview: '🎀',
    stickers: ['🎀','🎠','🧸','🪆','🎪','🎡','💎','🪄','🎩','🎨','🎭','🌂','🦋','🫧','🩷','🩵'],
  },
  {
    id: 'sports',
    name: 'スポーツ',
    preview: '⚽',
    stickers: ['⚽','🏀','🎾','🏐','⚾','🎱','🏓','🏸','🥊','🎯','🏆','🥇','🎽','🛹','🏄','🧗'],
  },
]
