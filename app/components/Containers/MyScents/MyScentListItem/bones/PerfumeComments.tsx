import { useTranslation } from "react-i18next"
import { MdDeleteForever } from "react-icons/md"

import { Button } from "~/components/Atoms/Button"
import VooDooCheck from "~/components/Atoms/VooDooCheck/VooDooCheck"
import { usePerfumeComments } from "~/hooks/usePerfumeComments"
import { useSessionStore } from "~/stores/sessionStore"
import type { UserPerfumeI } from "~/types"

interface PerfumeCommentsProps {
  userPerfume: UserPerfumeI
}
const PerfumeComments = ({ userPerfume }: PerfumeCommentsProps) => {
  const { t } = useTranslation()
  const { toggleModal } = useSessionStore()
  const { comments, uniqueModalId, toggleCommentVisibility, deleteComment } =
    usePerfumeComments({ userPerfume })

  const handleTogglePublic = async (commentId: string, currentIsPublic: boolean) => {
    await toggleCommentVisibility(commentId, currentIsPublic)
  }

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId)
  }

  return (
    <div className="mt1 p-4 rounded-md">
      <h3 className="text-lg font-semibold">{t("myScents.comments.heading")}</h3>
      <p className="text-sm  mb-2">
        {t("myScents.comments.subheading", {
          perfumeName: userPerfume.perfume.name,
        })}
      </p>
      {comments.length > 0 ? (
        <ul className="list-disc pl-5">
          {comments.map(comment => (
            <li
              key={comment.id}
              className="mb-1 border-b border-noir-dark/20 dark:border-noir-light/90 pb-2 bg-noir-light"
            >
              <p className="text-base">{comment.comment}</p>
              <div className="flex items-center justify-between mt-1 bg-noir-blue/10 p-2 rounded-md">
                <span className="text-xs text-noir-gray font-bold tracking-wide">
                  Created on : {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                <VooDooCheck
                  checked={comment.isPublic}
                  labelChecked={t("comments.makePublic", "Make this comment public")}
                  labelUnchecked={t(
                    "comments.makePrivate",
                    "Make this comment private"
                  )}
                  onChange={() => handleTogglePublic(comment.id, comment.isPublic)}
                />
                <Button
                  variant="icon"
                  onClick={() => handleDeleteComment(comment.id)}
                  background={"red"}
                >
                  <span className="text-white/90 font-bold text-sm">
                    Delete comment
                  </span>
                  <MdDeleteForever size={20} fill="white" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-noir-gold-500 mb-2">
          {t("myScents.comments.noComments")}
        </p>
      )}
      <Button
        className="mt-2"
        onClick={() => {
          const buttonRef = { current: document.createElement("button") }
          toggleModal(buttonRef as any, uniqueModalId, { action: "create" })
        }}
        size={"sm"}
      >
        {t("myScents.comments.addCommentButton")}
      </Button>
    </div>
  )
}

export default PerfumeComments
