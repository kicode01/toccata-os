# Dockerfile to build Toccata OS from any host OS (Windows, macOS, Linux)
FROM archlinux:latest

RUN pacman -Syu --noconfirm && \
    pacman -S --noconfirm archiso git make python

WORKDIR /toccata

COPY . /toccata

CMD ["bash", "/toccata/build/build-iso.sh"]
