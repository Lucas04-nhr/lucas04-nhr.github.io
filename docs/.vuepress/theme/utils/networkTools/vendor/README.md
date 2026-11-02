# Vendored network tool logic

These files are copied from yt1988's MIT-licensed projects. See `LICENSE` for the notice, which must stay with them. Keep local changes to the list below so they are easy to reapply when syncing upstream.

| Directory | Upstream | Commit |
| --- | --- | --- |
| `speed-test/` | https://github.com/yt1988/speed-test | `f94d86c` |
| `egresslens/` | https://github.com/yt1988/egresslens | `ab1e01f` |
| `who-are-you/` | https://github.com/yt1988/who-are-you | `83a94a8` |
| `unlock-check/` | https://github.com/yt1988/unlock-check | `f065048` |
| `cdn-radar/` | https://github.com/yt1988/cdn-radar | `7de1c36` |
| `dns-test/` | https://github.com/yt1988/dns-test | `08a76a0` |
| `ipv6-test/` | https://github.com/yt1988/ipv6-test | `253ae1b` |

## Local changes

- `ipv6-test/probe.mjs`: the dual-stack probe uses `https://ip.lucas04.top/cdn-cgi/trace`, and DNS-over-HTTPS probes query `ip.lucas04.top` instead of `1ms.dog` names.
- `cdn-radar/cdns.mjs`: the last Cloudflare fallback uses `https://ip.lucas04.top/cdn-cgi/trace`.
- `cdn-radar/probe.mjs`: DNS lookups use `https://ip.lucas04.top/v1/dns`, with the browser's normal HTTP caching.
- `egresslens/probes.mjs`: the `self` probe uses `https://ip.lucas04.top/v1/me`.
- `dns-test/resolvers.mjs`: `NXZONE` is `nx.dns.lucas04.top`. Names under it must return NXDOMAIN.
