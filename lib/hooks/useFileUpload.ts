import { convertFileToBase64 } from '@/lib/utils/helpers'
import { ChangeEvent, useEffect, useState } from 'react'
import { Path, PathValue } from 'react-hook-form'

interface UseFileUploadProps<TFormValues> {
  form: any
  fieldName: Path<TFormValues>
  initialImage?: string
}

const useFileUpload = <TFormValues extends Record<string, any>>({
  form,
  fieldName,
  initialImage = '',
}: UseFileUploadProps<TFormValues>) => {
  const [image, setImage] = useState(initialImage || '')

  useEffect(() => {
    setImage(initialImage || '')
    form.setValue(
      fieldName,
      (initialImage || '') as PathValue<TFormValues, Path<TFormValues>>,
    )
  }, [initialImage, fieldName, form])
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpg', 'image/jpeg'].includes(file.type)) {
      form.setError(fieldName, {
        type: 'manual',
        message: 'Invalid file type. Please upload PNG, JPG or JPEG.',
      })
      return
    }

    if (file.size > 3_000_000) {
      form.setError(fieldName, {
        type: 'manual',
        message: 'File too large. Max size is 3MB.',
      })
      return
    }

    form.clearErrors(fieldName)
    const base64Image = await convertFileToBase64(file)
    const finalImage = `data:${file.type};base64,${base64Image}`
    setImage(finalImage)
    form.setValue(
      fieldName,
      finalImage as PathValue<TFormValues, Path<TFormValues>>,
    )
  }

  const handleFileRemove = () => {
    setImage('')
    form.setValue(fieldName, '' as PathValue<TFormValues, Path<TFormValues>>)
  }

  return { image, handleFileChange, handleFileRemove }
}

export default useFileUpload
