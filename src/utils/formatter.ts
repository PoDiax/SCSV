export class FileFormatter {
  static formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  static formatSizeWithUnit(bytes: number, useGB: boolean): string {
    if (bytes === 0) return '0 B'
    
    if (useGB) {
      const gb = bytes / (1024 * 1024 * 1024)
      return `${gb.toFixed(2)} GB`
    } else {
      const mb = bytes / (1024 * 1024)
      return `${mb.toFixed(2)} MB`
    }
  }

  static formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num)
  }

  static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }
}