import { useState, useRef } from 'react'
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileContent: (content: string, type: 'text' | 'image', mimeType?: string) => void
  className?: string
}

const ACCEPTED_TEXT_TYPES = '.txt,.md,.js,.jsx,.ts,.tsx,.json,.csv,.yml,.yaml'
const ACCEPTED_IMAGE_TYPES = '.jpg,.jpeg,.png,.gif,.webp'

export function FileUpload({ onFileContent, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<{ content: string; type: 'text' | 'image'; mimeType?: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file) return

    try {
      setIsLoading(true)
      setFileName(file.name)

      if (file.type.startsWith('image/')) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('Image file size must be less than 10MB')
        }

        // Handle image file
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const base64 = e.target?.result as string
            // Remove the data URL prefix and only send the base64 data
            const base64Data = base64.split(',')[1]

            // Create an image element to check dimensions
            const img = new Image()
            img.src = base64
            await new Promise((resolve, reject) => {
              img.onload = resolve
              img.onerror = reject
            })

            // Check image dimensions
            if (img.width * img.height > 4096 * 4096) {
              throw new Error('Image dimensions too large. Maximum size is 4096x4096 pixels.')
            }

            setFileContent({
              content: base64Data,
              type: 'image',
              mimeType: file.type
            })
            setIsLoading(false)
          } catch (err) {
            setIsLoading(false)
            throw err
          }
        }
        reader.onerror = () => {
          setIsLoading(false)
          throw new Error('Failed to read image file')
        }
        reader.readAsDataURL(file)
      } else {
        // Handle text file
        const text = await file.text()
        setFileContent({
          content: text,
          type: 'text'
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error reading file:', error)
      alert(error instanceof Error ? error.message : 'Failed to process file')
      clearFile()
      setIsLoading(false)
    }
  }

  const handleSubmit = () => {
    if (fileContent) {
      onFileContent(fileContent.content, fileContent.type, fileContent.mimeType)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const clearFile = () => {
    setFileName(null)
    setFileContent(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        className="hidden"
        accept={`${ACCEPTED_TEXT_TYPES},${ACCEPTED_IMAGE_TYPES}`}
      />
      
      <div className="space-y-3">
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer',
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            fileName && 'border-solid'
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : fileName ? (
            <div className="flex items-center gap-2">
              {fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="flex-1 text-sm truncate">{fileName}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearFile()
                }}
                className="p-1 hover:bg-accent rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm text-center">
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-muted-foreground">Support for text and image files</p>
              </div>
            </div>
          )}
        </div>

        {fileContent && (
          <div className="flex justify-between items-center">
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearFile()
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              <span>Submit</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 