import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useFetcher, useLoaderData, type LoaderFunctionArgs } from "react-router"
import VooDooDetails from "~/components/Atoms/VooDooDetails"
import DestashManager from "~/components/Containers/MyScents/DestashManager/DestashManager"
import { CommentsModal } from "~/components/Containers/MyScents"
import { GeneralDetails, PerfumeComments } from "~/components/Containers/MyScents/MyScentListItem/bones"
import DangerModal from "~/components/Organisms/DangerModal"
import Modal from "~/components/Organisms/Modal"
import { usePerfumeComments } from "~/hooks/usePerfumeComments"
import { getSingleUserPerfumeById } from "~/models/perfume.server"
import { getUserPerfumes } from "~/models/user.server"
import { useSessionStore } from "~/stores/sessionStore"
import type { UserPerfumeI } from "~/types"
import { sharedLoader } from "~/utils/sharedLoader"

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
    if (!params.scentId) {
        throw new Error("userPerfumeId param is required")
    }
    const user = await sharedLoader(request)
    const userPerfume = await getSingleUserPerfumeById(params.scentId, user.id)
    const allUserPerfumes = await getUserPerfumes(user.id)
    
    if (!userPerfume) {
        throw new Response("Perfume not found", { status: 404 })
    }
    
    return { userPerfume, allUserPerfumes }
}

const MySingleScent = () => {
    const { userPerfume, allUserPerfumes } = useLoaderData<typeof loader>()
    const fetcher = useFetcher()
    const { t } = useTranslation()
    const { modalOpen, modalId, closeModal } = useSessionStore()
    
    // Normalize allUserPerfumes to array
    const safeAllUserPerfumes = useMemo(() => allUserPerfumes ?? [], [allUserPerfumes])
    
    // Find the full user perfume from the list, or fallback to the loader result
    const thisPerfume = useMemo(() => {
        const found = safeAllUserPerfumes.find(
            up => up.id === userPerfume.id || up.perfumeId === userPerfume.perfumeId
        )
        return (found || userPerfume) as unknown as UserPerfumeI
    }, [safeAllUserPerfumes, userPerfume])
    
    // Memoize user perfumes list for DestashManager
    const userPerfumesList = useMemo(
        () => safeAllUserPerfumes as unknown as UserPerfumeI[],
        [safeAllUserPerfumes]
    )
    
    // State for DestashManager to update the list
    const [userPerfumesListState, setUserPerfumesListState] = useState<UserPerfumeI[]>(userPerfumesList)
    
    // Track the last loader data to detect when it actually changes
    const lastLoaderDataRef = useRef<string>(JSON.stringify(userPerfumesList.map(up => up.id).sort()))
    
    // Sync state when loader data changes (e.g., after revalidation)
    // But don't overwrite if state has more items (indicating manual updates from DestashManager)
    useEffect(() => {
        const currentLoaderIds = JSON.stringify(userPerfumesList.map(up => up.id).sort())
        const lastLoaderIds = lastLoaderDataRef.current
        
        // Only sync if loader data has actually changed
        if (currentLoaderIds !== lastLoaderIds) {
            setUserPerfumesListState(prevState => {
                const loaderIds = new Set(userPerfumesList.map(up => up.id))
                const stateIds = new Set(prevState.map(up => up.id))
                
                // If state has more items than loader, it means DestashManager added items
                // In that case, merge the new loader data with the manual updates
                if (stateIds.size > loaderIds.size) {
                    const manualUpdateIds = [...stateIds].filter(id => !loaderIds.has(id))
                    const manualUpdates = prevState.filter(up => manualUpdateIds.includes(up.id))
                    // Merge: loader data + manual updates
                    return [...userPerfumesList, ...manualUpdates]
                } else {
                    // State doesn't have manual updates, safe to sync from loader
                    return userPerfumesList
                }
            })
            
            lastLoaderDataRef.current = currentLoaderIds
        }
    }, [userPerfumesList])
    
    const { uniqueModalId, addComment } = usePerfumeComments({ userPerfume: thisPerfume })
    const perfume = thisPerfume.perfume

    const handleRemovePerfume = (userPerfumeId: string) => {
        const formData = new FormData()
        formData.append("userPerfumeId", userPerfumeId)
        formData.append("action", "remove")
        fetcher.submit(formData, { method: "post", action: "/admin/my-scents" })
        closeModal()
    }
    return (
        <>
        {modalOpen && modalId === "delete-item" && (
        <Modal innerType="dark" animateStart="top">
            <DangerModal 
                heading="Are you sure you want to remove this perfume?"
                description="Once removed, you will lose all history, notes and entries in the exchange."
                action={() => handleRemovePerfume(thisPerfume.id)} 
            />
        </Modal>
        )}
      {modalOpen && modalId === uniqueModalId && (
        <Modal innerType="dark" animateStart="top">
          <CommentsModal perfume={thisPerfume} addComment={addComment} />
        </Modal>
      )}
        <div className="mt-190 inner-container">
            <h1>{perfume.name}</h1>
            <VooDooDetails
                summary={t("myScents.listItem.viewComments")}
                className="text-start text-noir-dark  py-3 mt-3 bg-noir-gold noir-border-dk px-2 relative open:bg-noir-gold-100"
                name="inner-details"
            >
          <PerfumeComments userPerfume={thisPerfume} />
        </VooDooDetails>
        <VooDooDetails
            summary={t("myScents.listItem.viewDetails")}
            className="text-start text-noir-dark  py-3 mt-3 bg-noir-gold noir-border-dk px-2 relative open:bg-noir-gold-100"
            name="inner-details"
        >
            <GeneralDetails userPerfume={thisPerfume} />
        </VooDooDetails>
        <VooDooDetails
            summary={t("myScents.listItem.manageDestashes")}
            className="text-start text-noir-dark font-bold py-3 mt-3 bg-noir-gold px-2 rounded noir-border-dk relative open:bg-noir-gold-100"
            name="inner-details"
        >
            <DestashManager 
                perfumeId={perfume.id} 
                userPerfumes={userPerfumesListState}
                setUserPerfumes={setUserPerfumesListState} />
        </VooDooDetails>    
        </div>
        </>
    )
}


export default MySingleScent