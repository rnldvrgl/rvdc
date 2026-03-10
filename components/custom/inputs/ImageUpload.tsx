"use client"

import { Button } from "@/components/ui/button"
import { FormItem } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { getDisplayImage } from "@/lib/utils/helpers"
import { Trash } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  image: string
  type?: "profile_image" | "e_signature"
  fieldName: string
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleFileRemove: () => void
}

const ImageUpload = ({
  image,
  fieldName,
  type = "profile_image",
  handleFileChange,
  handleFileRemove,
}: ImageUploadProps) => {
  const displayImage = getDisplayImage(image, type)

  return (
    <FormItem className="border border-dashed rounded-lg p-4 flex flex-col sm:flex-row items-center gap-6 transition hover:shadow-sm">
      <div className="relative size-20 rounded-md overflow-hidden border group">
        <Image
          src={displayImage}
          fill
          alt="image-preview"
          className="object-cover transition duration-300 group-hover:opacity-80"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {image && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleFileRemove}
            aria-label="Remove image"
            className="absolute inset-0 flex items-center justify-center h-full  opacity-0 group-hover:opacity-100 transition"
          >
            <Trash className="w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="flex flex-col flex-1 w-full gap-2 text-sm">
        <div>
          <span className="font-medium">Upload image</span>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, JPEG up to 2MB
          </p>
        </div>
        <label
          role="button"
          className="inline-flex items-center justify-center w-max px-4 py-2 text-sm font-medium rounded-md cursor-pointer bg-primary text-primary-foreground shadow hover:bg-primary/90 transition"
        >
          Browse
          <Input
            type="file"
            accept="image/png, image/jpg, image/jpeg"
            name={fieldName}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>
    </FormItem>
  )
}

export default ImageUpload
