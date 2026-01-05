import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useFetcher, useLoaderData, useNavigate, useRevalidator, redirect, type LoaderFunctionArgs } from "react-router"
import VooDooDetails from "~/components/Atoms/VooDooDetails"
import DestashManager from "~/components/Containers/MyScents/DestashManager/DestashManager"
import { CommentsModal } from "~/components/Containers/MyScents"
import { GeneralDetails, PerfumeComments } from "~/components/Containers/MyScents/MyScentListItem/bones"
import DangerModal from "~/components/Organisms/DangerModal"
import Modal from "~/components/Organisms/Modal"
import { usePerfumeComments } from "~/hooks/usePerfumeComments"
import { getSingleUserPerfumeById } from "~/models/perfume.server"
import { getUserPerfumes } from "~/models/user.server"
import type { Comment } from "~/types/comments"
import { useSessionStore } from "~/stores/sessionStore"
import type { UserPerfumeI } from "~/types"
import { sharedLoader } from "~/utils/sharedLoader"
import TitleBanner from "~/components/Organisms/TitleBanner"
import { ROUTE_PATH as MY_SCENTS } from "~/routes/admin/MyScents"

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
    if (!params.scentId) {
        throw new Error("userPerfumeId param is required")
    }
    const user = await sharedLoader(request)
    const userPerfume = await getSingleUserPerfumeById(params.scentId, user.id)
    const allUserPerfumes = await getUserPerfumes(user.id)
    
    if (!userPerfume) {
        // If perfume not found (likely deleted), redirect to my-scents page
        // This prevents the 404 error when navigating after deletion
        // Use React Router's redirect helper which properly handles the redirect
        throw redirect("/admin/my-scents")
    }
    
    return { userPerfume, allUserPerfumes }
}

const MySingleScent = () => {
    const { userPerfume, allUserPerfumes } = useLoaderData<typeof loader>()
    const fetcher = useFetcher()
    const revalidator = useRevalidator()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { modalOpen, modalId, closeModal } = useSessionStore()
    const safeAllUserPerfumes = useMemo(() => allUserPerfumes ?? [], [allUserPerfumes])
    const thisPerfume = useMemo(() => {
        const foundById = safeAllUserPerfumes.find(up => up.id === userPerfume.id)
        if (foundById) {
            return { ...foundById, comments: userPerfume.comments || [] } as unknown as UserPerfumeI
        }
        const foundByPerfumeId = safeAllUserPerfumes.find(up => up.perfumeId === userPerfume.perfumeId)
        if (foundByPerfumeId) {
            return { ...foundByPerfumeId, comments: [] } as unknown as UserPerfumeI
        }
        return userPerfume as unknown as UserPerfumeI
    }, [safeAllUserPerfumes, userPerfume])
    
    const [fetchedComments, setFetchedComments] = useState<Comment[]>([])
    const commentsFetcher = useFetcher()
    
    useEffect(() => {
        if (thisPerfume.id !== userPerfume.id && thisPerfume.id) {
            const formData = new FormData()
            formData.append("action", "get-comments")
            formData.append("userPerfumeId", thisPerfume.id)
            commentsFetcher.submit(formData, { method: "post", action: "/api/user-perfumes" })
        } else {
            setFetchedComments([])
        }
    }, [thisPerfume.id, userPerfume.id])
    
    useEffect(() => {
        if (commentsFetcher.data && commentsFetcher.data.success && commentsFetcher.data.comments) {
            setFetchedComments(commentsFetcher.data.comments)
        }
    }, [commentsFetcher.data])
    
    const finalPerfume = useMemo(() => {
        if (thisPerfume.id === userPerfume.id) {
            return thisPerfume
        }
        if (fetchedComments.length > 0) {
            return { ...thisPerfume, comments: fetchedComments } as UserPerfumeI
        }
        const filteredComments = (userPerfume.comments || []).filter(
            (comment: Comment) => comment.userPerfumeId === thisPerfume.id
        )
        return { ...thisPerfume, comments: filteredComments } as UserPerfumeI
    }, [thisPerfume, userPerfume, fetchedComments])
    
    const userPerfumesList = useMemo(
        () => safeAllUserPerfumes as unknown as UserPerfumeI[],
        [safeAllUserPerfumes]
    )

    const [userPerfumesListState, setUserPerfumesListState] = useState<UserPerfumeI[]>(userPerfumesList)
    const lastLoaderDataRef = useRef<string>(JSON.stringify(userPerfumesList.map(up => up.id).sort()))
    
    useEffect(() => {
        const currentLoaderIds = JSON.stringify(userPerfumesList.map(up => up.id).sort())
        const lastLoaderIds = lastLoaderDataRef.current
        
        if (currentLoaderIds !== lastLoaderIds) {
            setUserPerfumesListState(prevState => {
                const loaderIds = new Set(userPerfumesList.map(up => up.id))
                const stateIds = new Set(prevState.map(up => up.id))
                if (stateIds.size > loaderIds.size) {
                    const manualUpdateIds = [...stateIds].filter(id => !loaderIds.has(id))
                    const manualUpdates = prevState.filter(up => manualUpdateIds.includes(up.id))
                    return [...userPerfumesList, ...manualUpdates]
                } else {
                    return userPerfumesList
                }
            })
            
            lastLoaderDataRef.current = currentLoaderIds
        }
    }, [userPerfumesList])
    
    const { uniqueModalId, addComment } = usePerfumeComments({ 
        userPerfume: finalPerfume,
        onCommentSuccess: () => {
            if (finalPerfume.id !== userPerfume.id) {
                const formData = new FormData()
                formData.append("action", "get-comments")
                formData.append("userPerfumeId", finalPerfume.id)
                commentsFetcher.submit(formData, { method: "post", action: "/api/user-perfumes" })
            } else {
                setTimeout(() => {
                    revalidator.revalidate()
                }, 500)
            }
        }
    })
    const perfume = finalPerfume.perfume

    const handleRemovePerfume = (userPerfumeId: string) => {
        console.log('handleRemovePerfume', userPerfumeId)
        closeModal()
        
        const formData = new FormData()
        formData.append("userPerfumeId", userPerfumeId)
        formData.append("action", "remove")
        
        // Submit the deletion request (will complete in background)
        fetcher.submit(formData, { method: "post", action: "/admin/my-scents" })
        
        // Navigate immediately to avoid loader being called on deleted perfume
        // The deletion will complete in the background
        navigate(MY_SCENTS, { replace: true })
    }
    return (
        <>
        {modalOpen && modalId === "delete-item" && (
        <Modal innerType="dark" animateStart="top">
            <DangerModal 
                heading="Are you sure you want to remove this perfume?"
                description="Once removed, you will lose all history, notes and entries in the exchange."
                action={() => handleRemovePerfume(finalPerfume.id)} 
            />
        </Modal>
        )}
      {modalOpen && modalId === uniqueModalId && (
        <Modal innerType="dark" animateStart="top">
          <CommentsModal perfume={finalPerfume} addComment={addComment} />
        </Modal>
      )}
      <TitleBanner
        image={perfume.image ?? ""}
        heading={perfume.name ?? ""}
      />
    <div className="inner-container">
        <GeneralDetails userPerfume={finalPerfume} deletePerfume={handleRemovePerfume}/>
        <VooDooDetails
            summary={t("myScents.listItem.viewComments")}
            className="text-start text-noir-dark  py-3 mt-3 bg-noir-gold noir-border-dk px-2 relative open:bg-noir-gold-100"
            name="inner-details"
        >
            <PerfumeComments userPerfume={finalPerfume} />
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