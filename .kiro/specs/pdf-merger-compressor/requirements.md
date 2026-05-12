# Requirements Document

## Introduction

The PDF Merger & Compressor feature turns the existing onepdf Next.js app into a client-side PDF toolkit. A public landing page exposes two tools — Merge and Compress — each on its own route. The Merge tool accepts two or more PDFs, shows a unified thumbnail grid of every page across all source PDFs, and lets the user reorder and delete pages before exporting a single merged PDF. The Compress tool accepts one PDF, lets the user choose a quality preset (High, Medium, Low), and produces a smaller PDF by re-rendering pages through pdfjs-dist and rebuilding with pdf-lib. All parsing, rendering, and export runs in the browser so that uploaded files never leave the user's device. Authentication is provided by Clerk through a shared Navbar but is optional for using either tool.

## Glossary

- **App**: The onepdf Next.js 16 App Router application as a whole.
- **Landing_Page**: The page served at route `/` that introduces the App and links to the two tools.
- **Navbar**: The top navigation component rendered by `app/layout.tsx` on every route.
- **Merge_Page**: The page served at route `/merge` that hosts the Merge_Tool.
- **Compress_Page**: The page served at route `/compress` that hosts the Compress_Tool.
- **Merge_Tool**: The client-side feature on Merge_Page that combines multiple PDFs into one.
- **Compress_Tool**: The client-side feature on Compress_Page that reduces a single PDF's file size.
- **Source_PDF**: A PDF file added to Merge_Tool or Compress_Tool by the user.
- **Page_Tile**: A draggable UI element in the Merge_Tool grid representing one page of one Source_PDF, showing a rendered thumbnail and a delete control.
- **Page_Grid**: The responsive grid of Page_Tile items in Merge_Tool, covering every page of every Source_PDF in their current order.
- **Merged_PDF**: The single PDF produced by Merge_Tool containing the remaining Page_Tile items in their current order.
- **Compression_Preset**: One of three named settings — High, Medium, Low — controlling DPI and JPEG quality used by Compress_Tool.
- **Compressed_PDF**: The PDF produced by Compress_Tool after re-rendering the Source_PDF at the selected Compression_Preset.
- **Clerk_Session**: The authenticated user session provided by `@clerk/nextjs`.
- **Client_Runtime**: The user's browser environment where all PDF processing executes.

## Requirements

### Requirement 1: Landing Page

**User Story:** As a visitor, I want a landing page that introduces the two PDF tools, so that I can pick the one I need without wading through unrelated UI.

#### Acceptance Criteria

1. WHEN a user navigates to route `/`, THE Landing_Page SHALL render a hero section that names the App and summarizes that the App merges and compresses PDFs entirely in the browser.
2. THE Landing_Page SHALL render exactly two shadcn Card components, one labeled Merge and one labeled Compress.
3. WHEN a user activates the Merge card, THE Landing_Page SHALL navigate the browser to route `/merge`.
4. WHEN a user activates the Compress card, THE Landing_Page SHALL navigate the browser to route `/compress`.
5. THE Landing_Page SHALL replace the existing demo form currently rendered in `app/page.tsx`.

### Requirement 2: Shared Navbar

**User Story:** As a user, I want a persistent navbar across every route, so that I can jump between tools and manage sign-in without losing my place.

#### Acceptance Criteria

1. THE App SHALL render the Navbar in `app/layout.tsx` on every route including `/`, `/merge`, and `/compress`.
2. THE Navbar SHALL render the App brand as a link to route `/` on the left side of the bar.
3. THE Navbar SHALL render two navigation links labeled Merge and Compress targeting `/merge` and `/compress` respectively in the center of the bar.
4. WHILE Clerk_Session is signed-out, THE Navbar SHALL render the Clerk `SignInButton` and `SignUpButton` components on the right side of the bar.
5. WHILE Clerk_Session is signed-in, THE Navbar SHALL render the Clerk `UserButton` component on the right side of the bar.
6. THE Navbar SHALL be defined as a dedicated component file imported by `app/layout.tsx` rather than inlined into the layout.
7. THE Merge_Tool and Compress_Tool SHALL remain fully usable while Clerk_Session is signed-out.

### Requirement 3: Merge Upload

**User Story:** As a user on the Merge_Page, I want to add two or more PDFs via file picker or drag-and-drop, so that I can start building a merged document.

#### Acceptance Criteria

1. THE Merge_Page SHALL render a file drop zone that accepts PDF files via file picker and via drag-and-drop from the operating system.
2. WHEN a user drops or selects one or more PDF files, THE Merge_Tool SHALL add each file as a Source_PDF and render its pages as Page_Tile items in the Page_Grid.
3. THE Merge_Tool SHALL allow the user to continue adding additional Source_PDF files after the initial selection without discarding the existing Page_Grid.
4. IF a selected file does not have MIME type `application/pdf` or a `.pdf` extension, THEN THE Merge_Tool SHALL reject the file and display an inline error message naming the rejected file.
5. WHILE the Page_Grid contains fewer than two pages in total, THE Merge_Tool SHALL disable the "Download merged PDF" action and display guidance that at least two pages are required to merge.

### Requirement 4: Merge Thumbnail Grid

**User Story:** As a user building a merged PDF, I want to see a thumbnail of every page across all uploaded PDFs in one grid, so that I can reason about the final document visually.

#### Acceptance Criteria

1. WHEN a Source_PDF is added, THE Merge_Tool SHALL render one Page_Tile per page of that Source_PDF using a thumbnail generated in the Client_Runtime by pdfjs-dist.
2. THE Page_Grid SHALL show Page_Tile items from all Source_PDF files in a single continuous grid, in the order they will appear in the Merged_PDF.
3. THE Page_Tile SHALL display the source file name, the source page number, and the current overall position in the Page_Grid.
4. WHILE a Page_Tile thumbnail is still being rendered, THE Merge_Tool SHALL display a loading placeholder in that tile.
5. IF thumbnail rendering fails for a page, THEN THE Merge_Tool SHALL display a fallback placeholder in that Page_Tile and keep the remaining Page_Grid functional.

### Requirement 5: Merge Reorder and Delete

**User Story:** As a user building a merged PDF, I want to drag pages to new positions and delete pages I don't need, so that the final document is exactly what I want.

#### Acceptance Criteria

1. WHEN a user drags a Page_Tile and drops it on another position in the Page_Grid, THE Merge_Tool SHALL move that Page_Tile to the drop position and shift the remaining Page_Tile items accordingly.
2. THE Merge_Tool SHALL allow a Page_Tile from one Source_PDF to be reordered into any position occupied by a Page_Tile from a different Source_PDF.
3. WHEN a user activates the delete control on a Page_Tile, THE Merge_Tool SHALL remove that Page_Tile from the Page_Grid and update the merge summary.
4. WHEN a user deletes every Page_Tile belonging to a given Source_PDF, THE Merge_Tool SHALL remove that Source_PDF from internal state so that its bytes are eligible for garbage collection.
5. THE Merge_Tool SHALL maintain the latest Page_Grid order as the single source of truth for the Merged_PDF export.

### Requirement 6: Merge Summary and Download

**User Story:** As a user, I want a summary panel and a download button, so that I can confirm the merge plan and save the final PDF locally.

#### Acceptance Criteria

1. THE Merge_Page SHALL render a summary panel displaying the total number of Source_PDF files, the total number of Page_Tile items currently in the Page_Grid, and a "Download merged PDF" action.
2. WHEN the user activates "Download merged PDF" and the Page_Grid contains at least two Page_Tile items, THE Merge_Tool SHALL build the Merged_PDF using pdf-lib in the Client_Runtime from the current Page_Grid order.
3. WHEN the Merged_PDF has been built, THE Merge_Tool SHALL trigger a browser download of the Merged_PDF with a filename of the form `merged-<timestamp>.pdf`.
4. WHILE the Merged_PDF is being built, THE Merge_Tool SHALL display progress feedback and disable the "Download merged PDF" action to prevent duplicate builds.
5. IF building the Merged_PDF throws an error, THEN THE Merge_Tool SHALL display a toast describing the failure and re-enable the "Download merged PDF" action.

### Requirement 7: Compress Upload

**User Story:** As a user on the Compress_Page, I want to upload a single PDF, so that I can shrink its file size.

#### Acceptance Criteria

1. THE Compress_Page SHALL render a file input that accepts exactly one PDF at a time via file picker and via drag-and-drop.
2. WHEN a user provides a PDF, THE Compress_Tool SHALL load the PDF as the current Source_PDF and display the file name and original byte size.
3. IF a user provides more than one file in a single drop, THEN THE Compress_Tool SHALL accept the first PDF in the drop and display a message indicating that additional files were ignored.
4. IF a selected file does not have MIME type `application/pdf` or a `.pdf` extension, THEN THE Compress_Tool SHALL reject the file and display an inline error message.
5. WHEN a new Source_PDF is provided while a previous one is loaded, THE Compress_Tool SHALL replace the previous Source_PDF and reset any prior Compressed_PDF and size comparison state.

### Requirement 8: Compression Preset Selection

**User Story:** As a user, I want to choose a compression preset, so that I can trade off file size against visual quality.

#### Acceptance Criteria

1. THE Compress_Tool SHALL render a control that lets the user pick exactly one Compression_Preset from the set {High, Medium, Low}.
2. THE Compress_Tool SHALL default the Compression_Preset selection to Medium when a Source_PDF is first loaded.
3. THE Compress_Tool SHALL define each Compression_Preset as a fixed pair of target DPI and JPEG quality values documented in the design.
4. WHEN the user changes the Compression_Preset after a Compressed_PDF has already been produced, THE Compress_Tool SHALL invalidate the existing Compressed_PDF and require the user to re-run compression.

### Requirement 9: Compress Execution and Download

**User Story:** As a user, I want to run compression and download the result, so that I end up with a smaller PDF on my device.

#### Acceptance Criteria

1. WHEN the user activates the compress action with a Source_PDF and a selected Compression_Preset, THE Compress_Tool SHALL render each page of the Source_PDF to a canvas using pdfjs-dist at the preset's target DPI in the Client_Runtime.
2. THE Compress_Tool SHALL re-encode each rendered page as a JPEG image at the preset's JPEG quality and embed the JPEG into a new PDF built with pdf-lib.
3. WHILE compression is running, THE Compress_Tool SHALL display a progress indicator reflecting pages completed versus total pages.
4. WHEN compression completes, THE Compress_Tool SHALL display the original byte size, the Compressed_PDF byte size, and the percentage size reduction.
5. WHEN the user activates "Download compressed PDF" after compression completes, THE Compress_Tool SHALL trigger a browser download of the Compressed_PDF with a filename of the form `<original-name>-compressed-<preset>.pdf`.
6. IF compression throws an error at any stage, THEN THE Compress_Tool SHALL display a toast describing the failure and re-enable the compress action.

### Requirement 10: Client-Side Processing and Privacy

**User Story:** As a privacy-conscious user, I want PDF processing to stay on my device, so that my documents never leave my browser.

#### Acceptance Criteria

1. THE App SHALL perform all PDF parsing, rendering, merging, and compression in the Client_Runtime.
2. THE App SHALL NOT send Source_PDF bytes, Merged_PDF bytes, or Compressed_PDF bytes to any backend, API route, or third-party endpoint.
3. THE Merge_Page and Compress_Page SHALL be implemented without introducing Next.js API routes or server actions that receive PDF content.
4. WHEN the user navigates away from Merge_Page or Compress_Page, THE App SHALL release references to loaded Source_PDF bytes so that they are eligible for garbage collection.

### Requirement 11: Performance Feedback

**User Story:** As a user processing large PDFs, I want the UI to stay responsive and to show progress, so that I know the App is working and can estimate when it will finish.

#### Acceptance Criteria

1. WHILE Merge_Tool is generating Page_Tile thumbnails, THE Merge_Page SHALL remain scrollable and allow the user to interact with already-rendered Page_Tile items.
2. THE Merge_Tool SHALL render Page_Tile thumbnails incrementally as each page finishes rendering rather than blocking on all pages at once.
3. WHILE Compress_Tool is producing the Compressed_PDF, THE Compress_Page SHALL keep the progress indicator updated at least once per processed page.
4. IF the user activates a secondary action while merge export or compression is running, THEN THE App SHALL either queue the action until processing finishes or disable the action and display guidance that processing is in progress.
