export interface LayoutRegion {
  id: string;
  type: 'cubby' | 'frame' | 'book' | 'knob';
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  /** CSS clip-path polygon() point list (percentages of this region's own box), for non-rectangular hotspots. */
  clipPath?: string;
}

export interface MediaPanelLayout {
  trigger: LayoutRegion;
  panelBounds: LayoutRegion;
  songTitle: LayoutRegion;
  buttons: {
    previous: LayoutRegion;
    playPause: LayoutRegion;
    next: LayoutRegion;
    volumeDown: LayoutRegion;
    volumeUp: LayoutRegion;
    shuffle: LayoutRegion;
  };
  minimize: LayoutRegion;
}

export interface ShelfLayout {
  imageWidth: number;
  imageHeight: number;
  cubbies: LayoutRegion[];
  frames: LayoutRegion[];
  books: LayoutRegion[];
  knobs: LayoutRegion[];
  mediaPanel: MediaPanelLayout;
  typewriter: LayoutRegion;
}
