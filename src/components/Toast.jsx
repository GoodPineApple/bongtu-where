/**
 * @param {{ message: string | null }} props
 */
export default function Toast({ message }) {
  if (!message) return null
  return (
    <div
      className="pointer-events-none fixed bottom-4 left-1/2 z-[60] max-w-[min(90vw,20rem)] -translate-x-1/2 rounded-lg bg-slate-900/90 px-4 py-2 text-center text-sm text-white shadow-lg"
      role="status"
    >
      {message}
    </div>
  )
}
