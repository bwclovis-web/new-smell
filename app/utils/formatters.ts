export const formatUserName = (reviewer: {
    firstName: string | null
    lastName: string | null
    username: string | null
  }) => {
    if (!reviewer) {
        return ""
    }
    if (reviewer.username) {
        return reviewer.username
    }
    const names = [reviewer.firstName, reviewer.lastName].filter(Boolean)
    return names.length > 0 ? names.join(" ") : ""
}
