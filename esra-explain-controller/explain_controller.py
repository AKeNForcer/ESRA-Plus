from flask import Flask, request
from dotenv import load_dotenv
import os
from gevent.pywsgi import WSGIServer
from threading import Thread
from queue import PriorityQueue, Queue
from datetime import datetime
import requests
from time import sleep

class ExplainController:
    def __init__(self, workers_url, work_limit) -> None:
        self._rr = 0
        self._q = PriorityQueue()
        self._slot_q = Queue(work_limit)
        for i in range(work_limit):
            self._slot_q.put(i)
        self._round_robin = 0
        self._workers_url = workers_url
        self._thread = Thread(target=self._run_daemon)
    
    def _send(self, slot, target_url, payload):
        print("post to", target_url, payload)
        # status = requests.post(target_url, json=payload).status_code
        print(requests.post(target_url, json=payload))
        sleep(5)
        print("post to", target_url, payload, "success")
        self._round_robin += 1
        self._round_robin %= len(self._workers_url)
        self._slot_q.put(slot)
        
    def _run_daemon(self):
        while True:
            print("wait")
            print(self._q.empty())
            _, _, endpoint, payload = self._q.get()
            slot = self._slot_q.get()
            print("slot:", slot)
            base_url = self._workers_url[self._round_robin]
            target_url = os.path.join(base_url, endpoint)
            Thread(target=self._send, args=(slot, target_url, payload)).start()
    
    def submit_work(self, priority, endpoint, payload):
        self._q.put((priority, datetime.now(), endpoint, payload))

    def start_daemon(self):
        self._thread.start()



load_dotenv()

WORKERS_URL = os.environ['WORKERS_URL'].strip().strip(",").strip('"').split('","')
print("workers:", WORKERS_URL, type(WORKERS_URL))
WORK_LIMIT = int(os.environ['WORK_LIMIT'])
print("work_limit:", WORK_LIMIT)

HOST = os.environ['HOST'] if 'HOST' in os.environ else ''
PORT = int(os.environ['PORT']) if 'PORT' in os.environ else 5000

exp_controller = ExplainController(WORKERS_URL, WORK_LIMIT)

app = Flask(__name__)

@app.route("/explain", methods=['POST'])
def gen_explain():
    payloads = request.json
    for payload in payloads:
        exp_controller.submit_work(1, "explain", payload)
    return "success"

if __name__ == '__main__':
    exp_controller.start_daemon()
    print(f"production server is running at {HOST}:{PORT}")
    http_server = WSGIServer((HOST, PORT), app)
    http_server.serve_forever()