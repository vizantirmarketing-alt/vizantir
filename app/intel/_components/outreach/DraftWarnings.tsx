import { Panel } from '@/app/intel/_components/ui/Panel'

/**
 * Things a pattern noticed in the draft that may or may not be wrong. They
 * never block approval; the owner reads the email and decides.
 */
export function DraftWarnings({ warnings }: { warnings: string[] }) {
  return (
    <Panel title="Check before approving">
      <ul className="list-disc space-y-1.5 pl-5" role="status">
        {warnings.map((warning) => (
          <li key={warning} className="intel-body leading-relaxed text-body">
            {warning}
          </li>
        ))}
      </ul>
    </Panel>
  )
}
