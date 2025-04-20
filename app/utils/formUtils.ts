export const validateEmail = (email: unknown): email is string => typeof email === "string" && email.length > 3 && email.includes("@")

export const createSigninObject = formData => {
  const email = formData.get("email")
  const bob = Object.fromEntries(formData.entries())
  return bob
}
