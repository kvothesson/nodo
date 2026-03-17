# -*- coding: utf-8 -*-
"""
Primitive: read videos_stats.csv and generate analisis_canal.md report.
Optional: pass work_dir as first argument (default: cwd).
"""
import sys
import csv
from pathlib import Path

DEFAULT_CSV = "videos_stats.csv"
DEFAULT_REPORT = "analisis_canal.md"


def get_work_dir():
    if len(sys.argv) > 1:
        return Path(sys.argv[1]).resolve()
    return Path.cwd()


def load_stats(csv_path: Path):
    rows = []
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row["view_count"] = int(row["view_count"])
            row["like_count"] = int(row["like_count"])
            row["comment_count"] = int(row["comment_count"])
            rows.append(row)
    return rows


def safe_title(t, max_len=50):
    s = (t[:max_len] + "…") if len(t) > max_len else t
    return s.replace("|", "-").encode("utf-8", errors="replace").decode("utf-8")


def run(work_dir: Path = None):
    work_dir = work_dir or get_work_dir()
    csv_path = work_dir / DEFAULT_CSV
    report_path = work_dir / DEFAULT_REPORT

    data = load_stats(csv_path)
    n = len(data)
    total_views = sum(v["view_count"] for v in data)
    total_likes = sum(v["like_count"] for v in data)
    total_comments = sum(v["comment_count"] for v in data)
    avg_views = total_views / n if n else 0
    avg_likes = total_likes / n if n else 0
    avg_comments = total_comments / n if n else 0

    by_views = sorted(data, key=lambda x: x["view_count"], reverse=True)
    by_likes = sorted(data, key=lambda x: x["like_count"], reverse=True)
    for v in data:
        v["engagement"] = (v["like_count"] / v["view_count"]) if v["view_count"] else 0
    by_engagement = [v for v in data if v["view_count"] >= 100]
    by_engagement.sort(key=lambda x: x["engagement"], reverse=True)

    lines = [
        "# Análisis del canal — YouTube",
        "",
        "## Resumen general",
        "",
        f"- **Videos analizados:** {n}",
        f"- **Vistas totales:** {total_views:,}",
        f"- **Likes totales:** {total_likes:,}",
        f"- **Comentarios totales:** {total_comments:,}",
        "",
        "## Promedios por video",
        "",
        f"- **Vistas promedio:** {avg_views:,.0f}",
        f"- **Likes promedio:** {avg_likes:,.0f}",
        f"- **Comentarios promedio:** {avg_comments:,.0f}",
        "",
        "## Top 10 por vistas",
        "",
        "| # | Título | Vistas | Likes | Comentarios |",
        "|---|--------|--------|-------|-------------|",
    ]
    for i, v in enumerate(by_views[:10], 1):
        title = safe_title(v["title"])
        lines.append(f"| {i} | {title} | {v['view_count']:,} | {v['like_count']:,} | {v['comment_count']:,} |")

    lines.extend([
        "",
        "## Top 10 por likes",
        "",
        "| # | Título | Likes | Vistas | Comentarios |",
        "|---|--------|-------|--------|-------------|",
    ])
    for i, v in enumerate(by_likes[:10], 1):
        title = safe_title(v["title"])
        lines.append(f"| {i} | {title} | {v['like_count']:,} | {v['view_count']:,} | {v['comment_count']:,} |")

    lines.extend([
        "",
        "## Top 10 engagement (likes/vistas, mínimo 100 vistas)",
        "",
        "| # | Título | Engagement % | Vistas | Likes |",
        "|---|--------|--------------|--------|-------|",
    ])
    for i, v in enumerate(by_engagement[:10], 1):
        title = safe_title(v["title"])
        pct = v["engagement"] * 100
        lines.append(f"| {i} | {title} | {pct:.2f}% | {v['view_count']:,} | {v['like_count']:,} |")

    buckets = [(0, 0), (1, 100), (101, 1000), (1001, 10000), (10001, 10**9)]
    bucket_labels = ["0 vistas", "1-100", "101-1K", "1K-10K", "10K+"]
    dist = [0] * len(buckets)
    for v in data:
        views = v["view_count"]
        for idx, (lo, hi) in enumerate(buckets):
            if lo <= views <= hi:
                dist[idx] += 1
                break

    lines.extend([
        "",
        "## Distribución de vistas por video",
        "",
        "| Rango | Cantidad de videos |",
        "|-------|--------------------|",
    ])
    for label, count in zip(bucket_labels, dist):
        lines.append(f"| {label} | {count} |")

    report_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Reporte guardado en: {report_path}")
    return report_path


if __name__ == "__main__":
    run()
