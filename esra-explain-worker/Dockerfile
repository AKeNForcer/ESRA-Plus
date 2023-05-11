FROM nvidia/cuda:11.7.0-devel-ubuntu18.04

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

RUN apt-get update -y && apt-get install git -y

COPY . .

RUN pip install -e ./utils/FastChat/

ENV FLASK_ENV=production
ENV FLASK_DEBUG=0

RUN python ./utils/setup-nltk.py

# WORKDIR /esra/utils/FastChat/repositories/GPTQ-for-LLaMa

# RUN python setup_cuda.py install

# WORKDIR /esra

# ENTRYPOINT ["cd", "/utils/FastChat/repositories/GPTQ-for-LLaMa/", "&&", "python", "setup_cuda.py", "install", "&&", "cd", "/esra"]

# CMD ["python", "explain_worker.py"]

ENV DISUTILS_USE_SDK=1

CMD ["bash", "run.sh"]