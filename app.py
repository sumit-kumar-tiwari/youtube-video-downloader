from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
import os
import time
import threading
import uuid
import re

app = Flask(__name__, static_folder='static')
CORS(app)

# Downloads folder setup
DOWNLOAD_FOLDER = os.path.join(app.static_folder, 'downloads')
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

download_tasks = {}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/info', methods=['GET'])
def get_video_info():
    url = request.args.get('url')
    if not url: return jsonify({'error': 'No URL provided'}), 400
    ydl_opts = {'quiet': True, 'no_warnings': True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            res_map = {}
            for f in info['formats']:
                if f.get('vcodec') != 'none' and f.get('height'):
                    h = f['height']
                    fps = f.get('fps') or 30
                    if h not in res_map or fps > res_map[h]:
                        res_map[h] = int(fps)
            sorted_keys = sorted(res_map.keys(), reverse=True)
            formatted_res = [{"quality": f"{h}p", "fps": res_map[h]} for h in sorted_keys]
            return jsonify({'title': info.get('title'), 'thumbnail': info.get('thumbnail'), 'resolutions': formatted_res})
    except Exception as e: return jsonify({'error': str(e)}), 500

# --- BACKGROUND WORKER ---
def run_download_in_background(task_id, url, height):
    try:
        # Filename bilkul simple rakhenge (No spaces, No special chars)
        simple_name = f"video_{int(time.time())}.mp4"
        save_path = os.path.join(DOWNLOAD_FOLDER, simple_name)
        
        ydl_opts = {
            'format': f'bestvideo[height<={height}]+bestaudio/best[height<={height}]',
            'outtmpl': save_path,
            'merge_output_format': 'mp4'
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            
        # Task Complete
        download_tasks[task_id] = {
            'status': 'completed', 
            'download_url': f"/get-file/{simple_name}", # Link taiyaar
            'filename': simple_name
        }

    except Exception as e:
        download_tasks[task_id] = {'status': 'failed', 'error': str(e)}

@app.route('/start-download', methods=['POST'])
def start_download():
    data = request.json
    task_id = str(uuid.uuid4())
    download_tasks[task_id] = {'status': 'processing'}
    
    # Thread start
    thread = threading.Thread(target=run_download_in_background, args=(task_id, data.get('url'), data.get('quality').replace('p', '')))
    thread.start()
    
    return jsonify({'task_id': task_id})

@app.route('/check-status/<task_id>', methods=['GET'])
def check_status(task_id):
    return jsonify(download_tasks.get(task_id, {'status': 'not_found'}))

# --- FORCE DOWNLOAD ROUTE ---
@app.route('/get-file/<filename>')
def get_file(filename):
    # Browser ko force karega download karne ke liye
    file_path = os.path.join(DOWNLOAD_FOLDER, filename)
    return send_file(file_path, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)

if __name__ == '__main__':
    # Cloud server ka port uthana zaroori hai
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)