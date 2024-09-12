from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import docker
import socket
from werkzeug.utils import secure_filename
from pydantic import BaseModel, ValidationError

app = Flask(__name__)
CORS(app)
client = docker.from_env()

# Configuration for file upload
UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'py'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Pydantic validation for incoming data
class RunContainerRequest(BaseModel):
    endpoint: int
    image_name: str

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/build_and_run', methods=['POST'])
def build_and_run():
    if 'file' not in request.files:
        return jsonify({"error": "Missing file", "status": 400}), 400

    try:
        data = RunContainerRequest(**request.form)
    except ValidationError as e:
        return jsonify({"error": "Invalid request", "message": e.errors(), "status": 400}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected", "status": 400}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File must be a Python (.py) file", "status": 400}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    file.save(file_path)

    dockerfile_config = f"""FROM python:3.9-slim-buster
WORKDIR /app
COPY ./requirements.txt /app
RUN pip install -r requirements.txt
COPY . .
EXPOSE {data.endpoint}
ENV FLASK_APP={filename}
CMD ["flask", "run", "--host", "0.0.0.0","--port","{data.endpoint}"]
    """

    # Write Dockerfile
    dockerfile_path = os.path.join(app.config['UPLOAD_FOLDER'], "Dockerfile")
    with open(dockerfile_path, "w") as f:
        f.write(dockerfile_config)

    try:
        # Build the Docker image
        client.images.build(path=app.config['UPLOAD_FOLDER'], tag=data.image_name)

        # Run the Docker container
        container = client.containers.run(
            data.image_name,
            name=f'{data.image_name}-con',
            detach=True,
            ports={f'{data.endpoint}/tcp': data.endpoint}
        )
        #get the local ip address
        container_info = client.api.inspect_container(container.id)
        ports = container_info['NetworkSettings']['Ports']
        hostname = socket.gethostname()
        ip_address = socket.gethostbyname(hostname)

        urls = []
        for port, binding in ports.items():
            if binding:
                external_port = binding[0]['HostPort']
                urls.append(f"http://{ip_address}:{external_port}")
                
        return jsonify({"urls": urls, "status": 200})

    except Exception as e:
        return jsonify({"error": str(e), "status": 500}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)