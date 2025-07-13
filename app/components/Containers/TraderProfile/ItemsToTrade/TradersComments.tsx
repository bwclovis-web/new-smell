const TradersComments = ({ comments }) => (
  <ul>
    {comments.map((comment: any) => (
      <li key={comment.id} className="text-sm  p-2 rounded border-l-4 border-noir-gold-500">
        <span className="text-xs text-noir-gold-100">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
        <p className="text-noir-gold">{comment.comment}</p>
      </li>
    ))}
  </ul>
)

export default TradersComments
