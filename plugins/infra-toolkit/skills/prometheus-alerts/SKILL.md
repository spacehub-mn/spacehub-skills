---
name: prometheus-alerts
description: Use this skill when setting up Prometheus + Node Exporter + Windows Exporter + Grafana alerts, writing PromQL alert rules, or troubleshooting why a Grafana alert never fires. Covers scrape config, exporter targets, alert rule expressions, and Grafana contact-point + notification-policy wiring. Trigger phrases include "prometheus alert", "grafana alerting", "node exporter", "windows exporter", "promql", "alertmanager".
when_to_use: User is editing prometheus.yml, a Grafana alert rule, or an Alertmanager config; user reports a flapping or missing alert; user mentions a metric name like node_cpu_seconds_total or windows_logical_disk_free_bytes.
---

# Prometheus Alerts

## When to use this skill

- Standing up a fresh Prometheus + Grafana stack on a Linux or Windows host.
- Writing or tuning a PromQL alert rule (CPU, disk, memory, service down).
- Debugging why a Grafana-managed alert is `Pending` forever or never reaches a contact point.

## Instructions

1. **Confirm the stack shape.** Self-hosted Prometheus + Grafana, or Grafana Cloud with Mimir? The config surface is different.
2. **For exporters**: Node Exporter (Linux) listens on `:9100`, Windows Exporter on `:9182`. Add as scrape targets in `prometheus.yml`. Verify reachability with a direct curl from the Prometheus host before debugging the rule.
3. **For alert rules**, prefer Grafana-managed alerts (UI + provisioning YAML) over Prometheus-side `rules.yml` — easier review and notification routing in one place. Use `for: 5m` or longer to avoid flapping; `for: 0` only for hard failures.
4. **PromQL idioms**:
   - High CPU (Linux): `100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85`
   - Low disk: `node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100 < 10`
   - Service down: `up{job="<job>"} == 0`
5. **For "alert never fires"**, check in this order: rule evaluation interval, `for:` duration, label matchers on the contact point, notification policy mute timings, and finally the contact point itself (test with the Test button).
6. **For "alert fires constantly"**, the threshold is too tight or the metric is noisy — add a rolling average or raise `for:`.

## Examples

**Trigger:** "set up prometheus to alert on disk usage on this ubuntu box"
**Response shape:** Walk through Node Exporter install, scrape config, alert rule with the disk PromQL, contact point, notification policy.

**Trigger:** "grafana alert says firing but nobody got pinged"
**Response shape:** Check notification policy match labels, contact-point integration health, and mute timings.

## Notes

- Grafana Cloud free tier has notification rate limits; bursting can silently drop messages.
- Windows Exporter's collector list defaults are minimal; explicitly enable `logical_disk`, `service`, and `cpu` if you need them.
- Use `absent()` to alert on missing metrics (e.g., a job stopped scraping). Bare comparisons return empty when metric is gone, so the alert silently stops firing.

<!-- TODO: Add reference Grafana dashboard JSON once the public template is finalized. -->
