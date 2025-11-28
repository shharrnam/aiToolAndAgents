"""
Text Utilities - Common text cleaning and processing functions.

Educational Note: Clean text is important for:
- Embeddings: Excessive whitespace/newlines reduce embedding quality
- Token counting: Clean text gives more accurate counts
- Storage: Smaller file sizes without redundant whitespace
- Display: Better readability in UI

This utility also provides text splitting for RAG chunking:
- Split large text into logical "pages" for better embedding
- Find natural break points (paragraph/line endings)
- Used by text file processing and pasted text uploads

This utility provides reusable functions for text cleaning across services.
"""
import re
from typing import List


def clean_text_for_embedding(text: str) -> str:
    """
    Clean text before creating embeddings.

    Educational Note: OpenAI embeddings work best with clean text.
    Excessive whitespace and newlines add noise without semantic value.

    Cleaning steps:
    1. Strip leading/trailing whitespace
    2. Replace multiple newlines with single newline
    3. Replace multiple spaces with single space
    4. Final trim

    Args:
        text: Raw text to clean

    Returns:
        Cleaned text ready for embedding
    """
    if not text:
        return ""

    # Strip leading/trailing whitespace
    text = text.strip()

    # Replace multiple newlines with single newline
    text = re.sub(r'\n{2,}', '\n', text)

    # Replace multiple spaces with single space
    text = re.sub(r' {2,}', ' ', text)

    # Final trim
    text = text.strip()

    return text


def clean_chunk_text(text: str) -> str:
    """
    Clean chunk text, removing metadata headers if present.

    Educational Note: Our chunk files have metadata headers like:
        # Chunk Metadata
        # source_id: ...
        # ---

        [actual content]

    This function removes the header and cleans the remaining text.

    Args:
        text: Raw chunk text (may include metadata header)

    Returns:
        Cleaned text without metadata header
    """
    if not text:
        return ""

    # Remove metadata header if present
    # Header format: # Chunk Metadata ... # ---
    if text.startswith("# Chunk Metadata"):
        header_end = text.find("# ---")
        if header_end != -1:
            text = text[header_end + 5:]  # Skip past "# ---"

    # Apply standard embedding cleaning
    return clean_text_for_embedding(text)


def normalize_whitespace(text: str) -> str:
    """
    Normalize whitespace without being as aggressive as embedding cleaning.

    Educational Note: Sometimes we want to preserve paragraph breaks
    (double newlines) but still clean up excessive whitespace.

    Args:
        text: Text to normalize

    Returns:
        Text with normalized whitespace
    """
    if not text:
        return ""

    # Strip leading/trailing whitespace
    text = text.strip()

    # Replace 3+ newlines with double newline (preserve paragraphs)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Replace multiple spaces with single space
    text = re.sub(r' {2,}', ' ', text)

    return text


# --- Text Splitting for RAG ---

# Default configuration for text page splitting
DEFAULT_PAGE_SIZE = 6500  # Target characters per page
DEFAULT_SEARCH_WINDOW = 500  # How far to search for natural break


def split_text_into_pages(
    text: str,
    target_size: int = DEFAULT_PAGE_SIZE,
    search_window: int = DEFAULT_SEARCH_WINDOW
) -> List[str]:
    """
    Split text into logical pages based on character count and natural boundaries.

    Educational Note: Simply cutting at exact character counts would break
    mid-sentence or mid-word. Instead, we:
    1. Target ~6500 characters per page
    2. Look within 500 chars of target for a natural break point
    3. Break priority: paragraph (\\n\\n) > newline (\\n) > sentence end (. or ?)
    4. Fall back to exact cut only if no breaks found

    This is used for:
    - Text file uploads (.txt)
    - Pasted text sources
    - Any raw text that needs chunking for RAG

    Args:
        text: The full text content to split
        target_size: Target characters per page (~6500)
        search_window: How far to search for natural break (+/- 500 chars)

    Returns:
        List of page strings
    """
    if not text or not text.strip():
        return []

    text = text.strip()

    # If text is smaller than target, return as single page
    if len(text) <= target_size + search_window:
        return [text]

    pages = []
    remaining = text

    while remaining:
        # If remaining text fits in one page, add it and done
        if len(remaining) <= target_size + search_window:
            pages.append(remaining)
            break

        # Find the best break point near target_size
        break_point = _find_break_point(remaining, target_size, search_window)

        # Extract page and continue with remaining
        page_text = remaining[:break_point]
        pages.append(page_text)
        remaining = remaining[break_point:].lstrip()

    return pages


def _find_break_point(text: str, target: int, window: int) -> int:
    """
    Find the best break point near the target position.

    Educational Note: We search for natural break points in this priority:
    1. Double newline (paragraph end) - best for semantic coherence
    2. Single newline - next best option
    3. Sentence end (. or ? followed by space) - maintains sentence integrity
    4. Exact target position - fallback if no breaks found

    We search from target-window to target+window to find the closest break.

    Args:
        text: The text to search in
        target: Target character position
        window: How far to search on either side

    Returns:
        The best break position
    """
    search_start = max(0, target - window)
    search_end = min(len(text), target + window)
    search_region = text[search_start:search_end]

    # Priority 1: Find double newline (paragraph break) closest to target
    para_breaks = []
    pos = 0
    while True:
        idx = search_region.find('\n\n', pos)
        if idx == -1:
            break
        # Position in original text, +2 to include the newlines
        actual_pos = search_start + idx + 2
        para_breaks.append(actual_pos)
        pos = idx + 1

    if para_breaks:
        # Return the one closest to target
        return min(para_breaks, key=lambda x: abs(x - target))

    # Priority 2: Find single newline closest to target
    line_breaks = []
    pos = 0
    while True:
        idx = search_region.find('\n', pos)
        if idx == -1:
            break
        # Position in original text, +1 to include the newline
        actual_pos = search_start + idx + 1
        line_breaks.append(actual_pos)
        pos = idx + 1

    if line_breaks:
        return min(line_breaks, key=lambda x: abs(x - target))

    # Priority 3: Find sentence endings (. or ? followed by space) closest to target
    sentence_breaks = []
    for ending in ['. ', '? ']:
        pos = 0
        while True:
            idx = search_region.find(ending, pos)
            if idx == -1:
                break
            # Position in original text, +2 to include the ending and space
            actual_pos = search_start + idx + 2
            sentence_breaks.append(actual_pos)
            pos = idx + 1

    if sentence_breaks:
        return min(sentence_breaks, key=lambda x: abs(x - target))

    # Fallback: Cut at target position
    return target


def format_text_with_page_markers(
    pages: List[str],
    source_name: str = "unknown",
    source_type: str = "TEXT"
) -> str:
    """
    Format split pages into processed text with page markers.

    Educational Note: This creates page markers that the chunking service recognizes.
    Supports different source types:
        === TEXT PAGE 1 of 5 ===   (for .txt files and pasted text)
        === DOCX PAGE 1 of 5 ===   (for Word documents)
        === PPTX PAGE 1 of 5 ===   (for PowerPoint - handled by pptx_service directly)

    Note: PPTX files use pptx_service._build_output_content() which builds
    its own markers with additional slide metadata (title, visuals, layout).

    Args:
        pages: List of page text strings
        source_name: Name of the source file for header
        source_type: Type of source (TEXT, DOCX, PPTX) for marker prefix

    Returns:
        Formatted text with page markers
    """
    from datetime import datetime

    if not pages:
        return ""

    total_pages = len(pages)
    source_type = source_type.upper()

    # Build header based on source type
    if source_type == "DOCX":
        content = f"# Extracted from Word document: {source_name}\n"
    elif source_type == "PPTX":
        content = f"# Extracted from presentation: {source_name}\n"
    else:
        content = f"# Extracted from text file: {source_name}\n"

    content += f"# Total pages: {total_pages}\n"
    content += f"# Processed at: {datetime.now().isoformat()}\n\n"

    # Add each page with marker
    for i, page_text in enumerate(pages, start=1):
        content += f"=== {source_type} PAGE {i} of {total_pages} ===\n\n"
        content += page_text.strip()
        content += "\n\n"

    return content


