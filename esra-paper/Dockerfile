FROM nvidia/cuda:11.7.1-base-ubuntu20.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update -y

RUN apt-get install -y curl wget unzip tar software-properties-common build-essential && \
     apt-get clean && \
     rm -rf /var/lib/apt/lists/*

# Install anaconda
ENV CONDA_DIR /opt/conda

RUN wget --quiet https://repo.anaconda.com/archive/Anaconda3-2022.10-Linux-x86_64.sh -O ~/anaconda.sh && \
     /bin/bash ~/anaconda.sh -b -p /opt/conda

# Put conda in path so we can use conda activate
ENV PATH=$CONDA_DIR/bin:$PATH

WORKDIR /esra

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

RUN pip install --upgrade elasticsearch==8.5.3

COPY . .

ENV FLASK_APP=paper_service
ENV FLASK_ENV=production
ENV FLASK_DEBUG=0

CMD ["python", "paper_service.py"]
