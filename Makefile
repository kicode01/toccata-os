.PHONY: help test-bundle build-iso docker-build clean

help:
	@echo "Toccata OS Build System"
	@echo "========================"
	@echo "make test-bundle   : Test the .app bundle launcher on the sample TextEdit.app"
	@echo "make build-iso      : Build the bootable Toccata OS ISO (requires Linux + root)"
	@echo "make docker-build   : Build the ISO inside a Docker container (works on Windows/macOS)"
	@echo "make clean          : Remove build caches and artifacts"

test-bundle:
	python3 core/toccata-bundle/toccata-open core/toccata-bundle/sample/TextEdit.app

build-iso:
	sudo bash build/build-iso.sh

docker-build:
	docker build -t toccata-builder -f build/Dockerfile .
	docker run --privileged -v $(PWD)/out:/toccata/out toccata-builder

clean:
	rm -rf out /tmp/toccata-build
