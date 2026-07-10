export interface BgmPreset {
  id: string
  title: string
  subtitle: string
  /** YouTube video or playlist ID */
  youtubeId: string
}

export const BGM_PRESETS: BgmPreset[] = [
  {
    id: 'pukey-goddess-shot-trick',
    title: 'Pukey Goddess Shot Trick',
    subtitle: 'Twisted & noisy',
    youtubeId: 'JcxAXHykWUs',
  },
  {
    id: 'cyberpunk-lofi',
    title: 'Cyberpunk Lo-Fi',
    subtitle: 'Neon rain & synth pads',
    youtubeId: 'jfKfPfyJRdk',
  },
  {
    id: 'street-punk',
    title: 'Raw Street Punk',
    subtitle: 'Distorted guitars & grit',
    youtubeId: '5qap5aO4i9A',
  },
  {
    id: 'rainy-jazz',
    title: 'Rainy Day Jazz',
    subtitle: 'Smoky lounge after midnight',
    youtubeId: 'Dx5qFachd3A',
  },
]
