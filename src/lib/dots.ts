/** A colour circle's colour: one house colour, or several for a gradient (top left to bottom right). */
export type DotColor = string | string[];

/** A colour circle in the stream-button style, built from a house colour or a list of colours. */
export function dotFor(color: DotColor) {
  const [first, ...rest] = Array.isArray(color) ? color : [color];
  // One colour: light to dark of that colour. Several: the gradient itself, like the brand's icon.
  const body = rest.length
    ? `linear-gradient(150deg, ${[first, ...rest].join(', ')})`
    : `linear-gradient(150deg, color-mix(in srgb, ${first} 90%, #fff), ${first} 45%, color-mix(in srgb, ${first} 70%, #000))`;
  return `radial-gradient(circle at 38% 32%, color-mix(in srgb, ${first} 45%, #fff), transparent 55%), ${body}`;
}
