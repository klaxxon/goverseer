/*
MIT License

Copyright (c) 2018 klaxxon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Metric struct {
	Host     string `json:"host"`
	Metric   string `json:"metric"`
	Value    string `json:"value"`
	Interval int64  `json:"interval"`
}

type Metrics struct {
	APIKey  string   `json:"apikey,omitempty"`
	Metrics []Metric `json:"metrics"`
}

type EventBus struct {
	subscribers []chan string
	rm          sync.RWMutex
}

var eb EventBus

func (eb *EventBus) Subscribe(ch chan string) {
	eb.rm.Lock()
	eb.subscribers = append(eb.subscribers, ch)
	eb.rm.Unlock()
}

func (eb *EventBus) UnSubscribe(ch chan string) {
	eb.rm.Lock()
	for a, b := range eb.subscribers {
		if b == ch {
			eb.subscribers = append(eb.subscribers[0:a], eb.subscribers[a+1:]...)
			break
		}
	}
	eb.rm.Unlock()
}

func (eb *EventBus) SubCount() int {
	eb.rm.Lock()
	i := len(eb.subscribers)
	eb.rm.Unlock()
	return i
}

func handleMetrics(res http.ResponseWriter, req *http.Request) {
	var jsonData Metrics
	err := json.NewDecoder(req.Body).Decode(&jsonData)
	if err != nil {
		log.Printf("Error parsing JSON in APISetTilerData:%v\n", err)
		http.Error(res, "Error", http.StatusNotAcceptable)
		return
	}
	if len(jsonData.Metrics) == 0 {
		return
	}
	json.NewEncoder(res).Encode(jsonData.Metrics)
	fmt.Println(jsonData)

	b, err := json.Marshal(jsonData)
	if err != nil {
		fmt.Println("Cannot marshal ", err)
	}

	eb.rm.RLock()
	for _, ch := range eb.subscribers {
		ch <- string(b)
	}
	eb.rm.RUnlock()

	//	http.Error(res, "Accepted", http.StatusAccepted)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func handleWebSocket(res http.ResponseWriter, req *http.Request) {
	conn, _ := upgrader.Upgrade(res, req, nil) // error ignored for sake of simplicity

	ch := make(chan string)
	eb.Subscribe(ch)
	fmt.Printf("New websocket queue channel for %s, current %d\n", conn.RemoteAddr(), eb.SubCount())
	for {
		m := <-ch
		str := fmt.Sprintf("%v", m)
		if err := conn.WriteMessage(websocket.TextMessage, []byte(str)); err != nil {
			fmt.Printf("Error writing to websocket %v\n", err)
			break
		}

	}
	eb.UnSubscribe(ch)
	fmt.Printf("Websocket queue channel exited for %s, Current %d\n", conn.RemoteAddr(), eb.SubCount())
}

func main() {
	log.Println("Goverseer Server")

	eb = EventBus{subscribers: make([]chan string, 0)}

	log.Printf("Server started:  HTTPS:%s\n", HTTPSListenPort)
	//	box = packr.New("www", "./www")
	http.Handle("/", http.FileServer(http.Dir("www")))
	http.HandleFunc("/metric", handleMetrics)
	http.HandleFunc("/ws", handleWebSocket)
	//http.HandleFunc("/api/", makeGzipHandler(serveAPI))
	log.Fatal(http.ListenAndServeTLS(":"+HTTPSListenPort, "server.crt", "server.key", nil))
	log.Printf("Server ended")
}
