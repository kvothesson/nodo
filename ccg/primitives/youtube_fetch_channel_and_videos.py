# -*- coding: utf-8 -*-
"""
Primitive: fetch authenticated user's YouTube channel and all video stats, save to CSV.
Run from project root (where client_secret.json and token.json live).
Optional: pass work_dir as first argument.
"""
import os
import sys
import json
import csv
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"]
DEFAULT_CSV = "videos_stats.csv"


def get_work_dir():
    if len(sys.argv) > 1:
        return Path(sys.argv[1]).resolve()
    return Path.cwd()


def get_credentials(work_dir: Path):
    token_file = work_dir / "token.json"
    client_secret = work_dir / "client_secret.json"

    if token_file.exists():
        with open(token_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        from google.oauth2.credentials import Credentials
        return Credentials.from_authorized_user_info(data, SCOPES)

    flow = InstalledAppFlow.from_client_secrets_file(str(client_secret), SCOPES)
    creds = flow.run_local_server(port=0)
    with open(token_file, "w", encoding="utf-8") as f:
        f.write(creds.to_json())
    return creds


def get_youtube_service(work_dir: Path):
    creds = get_credentials(work_dir)
    return build("youtube", "v3", credentials=creds)


def get_own_channel(youtube):
    response = youtube.channels().list(
        part="snippet,statistics,contentDetails",
        mine=True
    ).execute()
    if not response["items"]:
        raise RuntimeError("No se encontró el canal del usuario autenticado.")
    return response["items"][0]


def get_uploads_playlist_id(channel):
    return channel["contentDetails"]["relatedPlaylists"]["uploads"]


def get_all_video_ids_from_playlist(youtube, playlist_id):
    video_ids = []
    page_token = None
    while True:
        response = youtube.playlistItems().list(
            part="contentDetails",
            playlistId=playlist_id,
            maxResults=50,
            pageToken=page_token
        ).execute()
        for item in response["items"]:
            video_ids.append(item["contentDetails"]["videoId"])
        page_token = response.get("nextPageToken")
        if not page_token:
            break
    return video_ids


def chunk_list(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


def get_videos_stats(youtube, video_ids):
    all_stats = []
    for chunk in chunk_list(video_ids, 50):
        response = youtube.videos().list(
            part="snippet,statistics",
            id=",".join(chunk)
        ).execute()
        for item in response["items"]:
            vid = item["id"]
            snip = item["snippet"]
            stats = item.get("statistics", {})
            all_stats.append({
                "video_id": vid,
                "title": snip.get("title", ""),
                "published_at": snip.get("publishedAt", ""),
                "view_count": int(stats.get("viewCount", 0)),
                "like_count": int(stats.get("likeCount", 0)),
                "comment_count": int(stats.get("commentCount", 0)),
            })
    return all_stats


def save_videos_to_csv(videos_stats, path: Path):
    fieldnames = [
        "video_id", "title", "published_at",
        "view_count", "like_count", "comment_count",
    ]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in videos_stats:
            writer.writerow(row)


def run(work_dir: Path = None):
    work_dir = work_dir or get_work_dir()
    youtube = get_youtube_service(work_dir)
    channel = get_own_channel(youtube)
    stats = channel["statistics"]
    print("=== Canal ===")
    print(f"Título: {channel['snippet']['title']}")
    print(f"Vistas totales: {stats.get('viewCount')}")
    print(f"Suscriptores: {stats.get('subscriberCount')}")
    print(f"Videos subidos: {stats.get('videoCount')}")

    uploads_playlist_id = get_uploads_playlist_id(channel)
    video_ids = get_all_video_ids_from_playlist(youtube, uploads_playlist_id)
    print(f"\nTotal de videos encontrados: {len(video_ids)}")

    videos_stats = get_videos_stats(youtube, video_ids)
    csv_path = work_dir / DEFAULT_CSV
    save_videos_to_csv(videos_stats, csv_path)
    print(f"\nSe guardó: {csv_path}")

    for v in videos_stats[:5]:
        safe = v["title"].encode("utf-8", errors="replace").decode("utf-8")[:60]
        print(f"- {safe}... | Vistas: {v['view_count']} | Likes: {v['like_count']}")
    return csv_path


if __name__ == "__main__":
    run()
