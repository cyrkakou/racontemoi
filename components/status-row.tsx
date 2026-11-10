export type DisplayStatus = "ok" | "error" | "pending";

type StatusRowProps = {
  label: string;
  value: string;
  status?: DisplayStatus;
  detail?: string;
};

export function StatusRow({
  label,
  value,
  status,
  detail,
}: StatusRowProps) {
  return (
    <div className="status-row">
      <dt>{label}</dt>
      <dd>
        {status ? (
          <span className="status-value" data-status={status}>
            {value}
          </span>
        ) : (
          value
        )}
        {detail ? <span className="status-detail">{detail}</span> : null}
      </dd>
    </div>
  );
}
