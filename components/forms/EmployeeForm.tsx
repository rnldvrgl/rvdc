"use client"

import { usePsgcForm } from "@/lib/hooks/usePsgcForm"
import { SubmitHandler, useForm } from "react-hook-form"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import DatePicker from "@/components/custom/inputs/DatePicker"
import ImageUpload from "@/components/custom/inputs/ImageUpload"
import type { PsgcSelectProps } from "@/components/custom/inputs/PsgcSelect"
import { PsgcSelect } from "@/components/custom/inputs/PsgcSelect"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { ComboboxOption, Employee } from "@/lib/constants/types"
import useFileUpload from "@/lib/hooks/useFileUpload"
import { useEmployeeMutations } from "@/lib/mutations/useEmployeeMutations"
import { useStallChoices } from "@/lib/queries/useChoices"
import {
  Briefcase,
  CreditCard,
  Info,
  MapPin,
  Phone,
  User,
  Users,
} from "lucide-react"

// Form-specific type for handling assigned_stall as ID
type EmployeeFormData = Omit<Employee, "assigned_stall"> & {
  assigned_stall_id?: number | string
}

// Utility function to convert Employee to EmployeeFormData
const employeeToFormData = (employee?: Employee): Partial<EmployeeFormData> => {
  if (!employee) return {}

  return {
    ...employee,
    assigned_stall_id: employee.assigned_stall?.id,
  }
}

// Role options for ComboBox (admin not included - only for employees)
const roleOptions: ComboboxOption[] = [
  { value: "manager", label: "Manager" },
  { value: "clerk", label: "Clerk" },
  { value: "technician", label: "Technician" },
]

function LocationField({
  name,
  label,
  value,
  options,
  onChange,
  loading,
  disabled,
  placeholder,
  control,
}: PsgcSelectProps<EmployeeFormData>) {
  return (
    <FormField
      control={control}
      name={name}
      rules={{ required: `${label} is required` }}
      render={() => (
        <PsgcSelect
          control={control}
          name={name}
          label={label}
          value={value}
          options={options}
          onChange={onChange}
          placeholder={placeholder}
          loading={loading}
          disabled={disabled}
        />
      )}
    />
  )
}

interface EmployeeProps {
  employee?: Employee
  onClose: () => void
}

export default function EmployeeForm({ employee, onClose }: EmployeeProps) {
  const formData = employeeToFormData(employee)

  const form = useForm<EmployeeFormData>({
    defaultValues: {
      first_name: formData.first_name ?? "",
      last_name: formData.last_name ?? "",
      username: formData.username ?? "",
      contact_number: formData.contact_number ?? "",
      address: formData.address ?? "",
      province: "",
      city: "",
      barangay: "",
      sss_number: formData.sss_number ?? "",
      tin_number: formData.tin_number ?? "",
      philhealth_number: formData.philhealth_number ?? "",
      basic_salary: formData.basic_salary ?? 0,
      profile_image: "",
      role: formData.role ?? "technician",
      birthday: formData.birthday ?? "",
      assigned_stall_id: formData.assigned_stall_id?.toString() ?? "none",
    },
  })

  const upload = useFileUpload({
    form,
    fieldName: "profile_image",
    initialImage: employee?.profile_image,
  })

  const { data: stallsData } = useStallChoices({})
  const stalls = stallsData ?? []

  // Watch the role field to conditionally show stall assignment
  const selectedRole = form.watch("role")
  const showStallAssignment =
    selectedRole === "manager" || selectedRole === "clerk"

  // Create stall options for ComboBox
  const stallOptions: ComboboxOption[] = [
    { value: "none", label: "No stall assigned" },
    ...stalls.map((stall) => ({
      value: stall.id.toString(),
      label: stall.name,
    })),
  ]

  const {
    selectedProvince,
    selectedCity,
    selectedBarangay,
    sortedProvinces,
    sortedCities,
    sortedBarangays,
    loadingProvinces,
    loadingCities,
    loadingBarangays,
    provinceName,
    cityName,
    barangayName,
    handleProvinceChange,
    handleCityChange,
    handleBarangayChange,
  } = usePsgcForm<EmployeeFormData>({ form, defaultValues: formData })

  const { addEmployee, updateEmployee } = useEmployeeMutations()

  const handleSubmit: SubmitHandler<EmployeeFormData> = (data) => {
    const payload = {
      ...data,
      province: provinceName,
      city: cityName,
      barangay: barangayName,
      // Convert stall assignment
      assigned_stall_id:
        data.assigned_stall_id === "none" || !data.assigned_stall_id
          ? undefined
          : typeof data.assigned_stall_id === "string"
            ? parseInt(data.assigned_stall_id)
            : data.assigned_stall_id,
    }

    if (employee?.id) {
      updateEmployee.mutate(
        { id: employee.id, data: payload },
        {
          onSuccess: onClose,
        },
      )
    } else {
      addEmployee.mutate(payload, {
        onSuccess: onClose,
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-8"
        >
          {/* Info Alert for New Employees */}
          {!employee && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> Default password will be automatically
                generated.
                <br />
                <span className="text-sm text-muted-foreground">
                  If you don&apos;t provide a username, it will be created from
                  name initials (e.g., Ronald Vergel Dela Cruz → rvdc).
                  <br />
                  Default password will be:{" "}
                  <code className="font-mono bg-muted px-1 py-0.5 rounded">
                    rvdc12
                  </code>
                  <br />
                  Employees can change their username and password later in
                  their profile settings.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Image Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Profile Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="profile_image"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        fieldName={field.name}
                        handleFileChange={upload.handleFileChange}
                        handleFileRemove={upload.handleFileRemove}
                        image={upload.image}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 grid">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="first_name"
                  rules={{
                    required: "First name is required",
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Juan"
                          className="h-11"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  rules={{
                    required: "Last name is required",
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Dela Cruz"
                          className="h-11"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Username Field (optional for new employees) */}
              {!employee && (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Leave empty to auto-generate from initials"
                          className="h-11"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {/* Birthday Field */}
              <FormField
                control={form.control}
                name="birthday"
                rules={{
                  required: "Birthday is required",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <DatePicker
                        field={{
                          value: field.value
                            ? new Date(field.value)
                            : undefined,
                          onChange: (date: Date | undefined) => {
                            field.onChange(
                              date ? date.toISOString().split("T")[0] : "",
                            )
                          },
                        }}
                        required
                        label="Birthday"
                        placeholder="Select birthday"
                        className="w-full"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="size-5" />
                Employment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role and Salary */}
              <FormField
                control={form.control}
                name="role"
                rules={{ required: "Role is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Role</FormLabel>
                    <FormControl>
                      <ComboBox
                        options={roleOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select a role"
                        searchPlaceholder="Search roles..."
                        className="h-11"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basic_salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Basic Salary</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        placeholder="25000.00"
                        className="h-11"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Conditional Stall Assignment */}
              {showStallAssignment && (
                <>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="assigned_stall_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Stall</FormLabel>
                        <FormControl>
                          <ComboBox
                            options={stallOptions}
                            value={field.value?.toString() ?? "none"}
                            onChange={field.onChange}
                            placeholder="Select a stall (optional)"
                            searchPlaceholder="Search stalls..."
                            className="h-11"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="size-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid space-y-6">
              <FormField
                control={form.control}
                name="contact_number"
                rules={{
                  required: "Contact number is required",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Contact Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="09XX XXX XXXX"
                        className="h-11"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                rules={{
                  required: "Address is required",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Street, Subdivision, etc."
                        className="h-11"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid">
                <LocationField
                  name="province"
                  label="Province"
                  value={selectedProvince ?? ""}
                  options={sortedProvinces}
                  onChange={handleProvinceChange}
                  placeholder="Select Province"
                  loading={loadingProvinces}
                  control={form.control}
                />

                <LocationField
                  name="city"
                  label="City / Municipality"
                  value={selectedCity ?? ""}
                  options={sortedCities}
                  onChange={handleCityChange}
                  placeholder="Select City/Municipality"
                  loading={loadingCities}
                  disabled={!selectedProvince}
                  control={form.control}
                />

                <LocationField
                  name="barangay"
                  label="Barangay"
                  value={selectedBarangay ?? ""}
                  options={sortedBarangays}
                  onChange={handleBarangayChange}
                  placeholder="Select Barangay"
                  loading={loadingBarangays}
                  disabled={!selectedCity}
                  control={form.control}
                />
              </div>
            </CardContent>
          </Card>

          {/* Government IDs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
                Government IDs & Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid">
                <FormField
                  control={form.control}
                  name="sss_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SSS Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="XX-XXXXXXX-X"
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tin_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TIN Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="XXX-XXX-XXX-XXX"
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="philhealth_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PhilHealth Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="XX-XXXXXXXXX-X"
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              size="lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="min-w-32"
            >
              {employee ? "Update Employee" : "Create Employee"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
