package main

import (
	"flag"
	"log"
	"net/http"
)

var listenAddr string

func main() {
	flag.StringVar(&listenAddr, "listen-addr", ":5000", "server listen address")
	flag.Parse()

	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	log.Printf("Listening on %s...", listenAddr)
	err := http.ListenAndServe(listenAddr, nil)
	if err != nil {
		log.Fatal(err)
	}
}
