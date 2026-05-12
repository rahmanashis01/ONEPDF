# onepdf Logo Guide

## Logo Files

The onepdf project includes several logo variations for different use cases:

### 1. **favicon-logo.svg** (Favicon)
- **Size**: 200x200px
- **Use**: Browser tab icon, favicon
- **Format**: SVG
- **Background**: White
- **Style**: Minimal, clean PDF document with gradient

### 2. **logo.svg** (Standard Logo)
- **Size**: 200x200px
- **Use**: General purpose, web use
- **Format**: SVG
- **Background**: Transparent with border circle (Vercel style)
- **Features**: 
  - PDF document with gradient (pink to purple)
  - Merge indicator (left arrow)
  - Compress indicator (right compression symbol)
  - Brand text "onepdf" below

### 3. **logo-dark.svg** (Dark Theme)
- **Size**: 400x400px
- **Use**: Dark backgrounds, documentation, social media
- **Format**: SVG
- **Background**: Dark slate (#0f172a)
- **Features**:
  - High-quality gradient PDF document
  - Merge and compress indicators
  - Drop shadow effect
  - Brand text "onepdf"
  - Larger size for better quality

### 4. **logo-light.svg** (Light Theme)
- **Size**: 400x400px
- **Use**: Light backgrounds, documentation, social media
- **Format**: SVG
- **Background**: White
- **Features**:
  - Same design as dark version
  - Optimized for light backgrounds
  - Subtle shadow effect
  - Brand text in dark color

## Color Palette

The logos use the following color scheme:

- **Primary Gradient**: Pink (#ec4899) → Purple (#8b5cf6)
- **Accent Gradient**: Cyan (#06b6d4) → Blue (#3b82f6)
- **Dark Background**: #0f172a
- **Light Background**: #ffffff
- **Text**: White (on dark), Dark slate (on light)

## Usage

### In HTML
```html
<!-- Favicon -->
<link rel="icon" href="/favicon-logo.svg" type="image/svg+xml">

<!-- Logo for documentation -->
<img src="/logo-dark.svg" alt="onepdf logo" width="200" height="200">
```

### In Next.js Metadata
```typescript
export const metadata: Metadata = {
  icons: {
    icon: '/favicon-logo.svg',
    apple: '/favicon-logo.svg',
  },
}
```

### In Markdown
```markdown
![onepdf logo](/logo-dark.svg)
```

## Design Notes

- All logos feature a PDF document as the central element
- The merge indicator (left arrow) represents the merge functionality
- The compress indicator (right compression symbol) represents the compress functionality
- Gradients use modern, vibrant colors that match the brand identity
- SVG format ensures crisp rendering at any size
- All logos are optimized for web use

## Customization

To customize the logos:

1. Edit the SVG files directly in any text editor
2. Modify gradient colors in the `<defs>` section
3. Adjust sizes by changing the `viewBox` attribute
4. Change text by editing the `<text>` elements

## Export to Other Formats

To convert SVG logos to PNG or other formats:

```bash
# Using ImageMagick
convert logo-dark.svg -background none logo-dark.png

# Using Inkscape
inkscape logo-dark.svg -o logo-dark.png
```

## License

The onepdf logos are part of the onepdf project and are licensed under the MIT License.
