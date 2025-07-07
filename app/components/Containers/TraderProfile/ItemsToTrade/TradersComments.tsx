const TradersComments = ({ comments }) => (
  <ul>
    {comments.map((comment: any) => (
      <li key={comment.id} className="text-sm bg-noir-white p-2 rounded border-l-4 border-noir-blue">
        <span className="text-xs text-gray-400">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
        <p className="text-gray-700">"{comment.comment}"</p>
      </li>
    ))}
  </ul>
)

export default TradersComments
