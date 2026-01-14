//! Handles terminal progress visualization for file downloads.
//! We use `\r` carriage return to rewrite the same line repeatedly, creating
//! an animated progress bar. This gives users real-time feedback without
//! cluttering the terminal with hundreds of lines.
export function updateProgress(progress) {
    const percentage = Math.round((progress.downloadedFiles / progress.totalFiles) * 100);
    const bar = createProgressBar(percentage);
    process.stdout.write(`\r↓ Downloading: ${progress.downloadedFiles}/${progress.totalFiles} (${percentage}%) ${bar} ${truncate(progress.currentFile, 40)}`);
}
function createProgressBar(percentage, width = 20) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return '[' + '■'.repeat(filled) + '·'.repeat(empty) + ']';
}
/// Truncates long file paths to fit in the progress bar.
/// We keep the end of the path (filename) rather than the beginning, since
/// that's what users care about when tracking which file is downloading.
function truncate(str, maxLen) {
    if (str.length <= maxLen)
        return str;
    return '...' + str.slice(-maxLen + 3);
}
export function printSummary(totalFiles, successCount, failedCount, durationMs, outputDir) {
    console.log('\n\n' + '='.repeat(60));
    console.log('↓ DOWNLOAD COMPLETE');
    console.log('='.repeat(60));
    console.log(`✓ Successfully downloaded: ${successCount}/${totalFiles} files`);
    if (failedCount > 0) {
        console.log(`✗ Failed: ${failedCount} files`);
    }
    const durationSec = (durationMs / 1000).toFixed(2);
    console.log(`⏲ Duration: ${durationSec}s`);
    console.log(`→ Location: ${outputDir}`);
    console.log('='.repeat(60) + '\n');
}
//# sourceMappingURL=progress-display.js.map