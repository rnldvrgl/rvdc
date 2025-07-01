import { Button } from '@/components/ui/button'
import { FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Trash } from 'lucide-react'
import Image from 'next/image'
import { ChangeEvent } from 'react'

type ImageUploadProps = {
  image: string
  fieldName: string
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  handleFileRemove: () => void
}

const ImageUpload = ({
  image,
  fieldName,
  handleFileChange,
  handleFileRemove,
}: ImageUploadProps) => {
  // Use fallback image for safety
  const displayImage = image || '/default_image.jpg'

  return (
    <FormItem className="border border-dashed rounded-lg p-4 flex items-center justify-between gap-6">
      <div className="flex items-center gap-4 w-full">
        <div className="relative size-16 rounded-md overflow-hidden border">
          <Image
            src={displayImage}
            fill
            alt="image-preview"
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {image && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleFileRemove}
              className="absolute top-1 right-1 p-1 rounded-full transition"
            >
              <Trash className="size-3.5" />
            </Button>
          )}
        </div>

        <div className="flex flex-col flex-1 text-sm">
          <span className="font-medium">Upload image</span>
          <span className="text-xs text-muted-foreground">
            PNG, JPG, JPEG up to 2MB
          </span>
        </div>
      </div>

      <label className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md cursor-pointer bg-primary text-primary-foreground shadow-xs hover:bg-primary/90">
        Browse
        <Input
          type="file"
          accept="image/png, image/jpg, image/jpeg"
          name={fieldName}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
    </FormItem>
  )
}

export default ImageUpload
