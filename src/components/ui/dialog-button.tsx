import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export interface DialogField {
  id: string
  label: string
  placeholder?: string
  type?: "text" | "number" | "password" | "email"
  defaultValue?: string
  required?: boolean
}

interface ActionButtonProps {
  children?: React.ReactNode;
  dialogTitle?: string
  dialogDescription?: string
  confirmText?: string
  cancelText?: string
  fields?: DialogField[]
  onConfirm: (formValues: Record<string, string>) => void
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
}

export function DialogButton({
  children,
  dialogTitle = "Confirm Action",
  dialogDescription,
  confirmText = "Accept",
  cancelText = "Cancel",
  fields = [],
  onConfirm,
  className,
  variant = "default",
  size = "default",
}: ActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const [formValues, setFormValues] = useState<Record<string, string>>(() =>
    fields.reduce((acc, field) => {
      acc[field.id] = field.defaultValue ?? ""
      return acc
    }, {} as Record<string, string>)
  )

  const handleMainClick = () => {
    setFormValues(
      fields.reduce((acc, field) => {
        acc[field.id] = field.defaultValue ?? ""
        return acc
      }, {} as Record<string, string>)
    )
    setIsOpen(true)
  }

  const handleInputChange = (id: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [id]: value }))
  }

  const handleConfirm = () => {
    onConfirm(formValues)
    setIsOpen(false)
  }

  const isSubmitDisabled = fields.some(
    (field) => field.required && !formValues[field.id]?.trim()
  )

  return (
    <>
      <Button variant={variant} size={size} onClick={handleMainClick} className={className}>
        {children}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            {dialogDescription && (
              <DialogDescription>{dialogDescription}</DialogDescription>
            )}
          </DialogHeader>

          {fields.length > 0 && (
            <div className="grid gap-4">
              {fields.map((field) => (
                <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={field.id} className="text-right">
                    {field.label}
                  </Label>
                  <Input
                    id={field.id}
                    type={field.type ?? "text"}
                    placeholder={field.placeholder}
                    value={formValues[field.id] ?? ""}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="col-span-3"
                    autoFocus={fields[0].id === field.id}
                  />
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={isSubmitDisabled}
            >
              {confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
