import React, { useEffect, useRef, useState } from "react";
import chroma from "chroma-js";
import Graph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";
import Sigma from "sigma";
import { v4 as uuid } from "uuid";

const GraphCreate = () => {
  const containerRef = useRef(null); // Create a reference for the container
  const [inputValue, setInputValue] = useState(""); // State to store input

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a sample graph
    const graph = new Graph();
    graph.addNode("n1", { x: 0, y: 0, size: 10, color: chroma.random().hex() });
    graph.addNode("n2", { x: -5, y: 5, size: 10, color: chroma.random().hex() });
    graph.addNode("n3", { x: 5, y: 5, size: 10, color: chroma.random().hex() });
    graph.addNode("n4", { x: 0, y: 10, size: 10, color: chroma.random().hex() });
    graph.addEdge("n1", "n2");
    graph.addEdge("n2", "n4");
    graph.addEdge("n4", "n3");
    graph.addEdge("n3", "n1");

    // Create the spring layout and start it
    const layout = new ForceSupervisor(graph, { isNodeFixed: (_, attr) => attr.highlighted });
    layout.start();

    // Create the sigma renderer
    const renderer = new Sigma(graph, containerRef.current, {
      minCameraRatio: 0.5,
      maxCameraRatio: 2,
    });

    // Drag'n'drop logic
    let draggedNode = null;
    let isDragging = false;

    renderer.on("downNode", (e) => {
      isDragging = true;
      draggedNode = e.node;
      graph.setNodeAttribute(draggedNode, "highlighted", true);
      if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
    });

    renderer.on("moveBody", (e) => {
      if (!isDragging || !draggedNode) return;
      const pos = renderer.viewportToGraph(e);
      graph.setNodeAttribute(draggedNode, "x", pos.x);
      graph.setNodeAttribute(draggedNode, "y", pos.y);
      e.preventSigmaDefault();
    });

    const handleUp = () => {
      if (draggedNode) {
        graph.removeNodeAttribute(draggedNode, "highlighted");
      }
      isDragging = false;
      draggedNode = null;
    };
    renderer.on("upNode", handleUp);
    renderer.on("upStage", handleUp);

    return () => {
      renderer.kill();
    };
  }, []); // Runs only once when the component mounts

  // Handle the input change
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  // Handle the form submit (parsing adjacency list)
  const handleSubmit = (event) => {
    event.preventDefault();

    // Parse the input as an adjacency list
    const adjacencyList = inputValue.split("\n").map((line) => line.split(" "));
    console.log("Parsed Adjacency List: ", adjacencyList);

    // Here you could generate the graph using the adjacency list
    // Example: graph.addEdge(node1, node2) for each pair in adjacencyList
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        ref={containerRef}
        id="sigma-container"
        style={{
          flex: 1, // Make Sigma container take up the majority of the screen
          width: "100%",
          backgroundColor: "#f4f4f4",
        }}
      >
        {/* This div will serve as the container for Sigma.js */}
      </div>

      {/* Textbox area */}
      <form onSubmit={handleSubmit} style={{ padding: "10px", backgroundColor: "#fff" }}>
        <textarea
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Enter adjacency list here"
          rows={5}
          style={{
            width: "100%",
            resize: "none",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "8px",
          }}
        />
        <button
          type="submit"
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Generate Graph
        </button>
      </form>
    </div>
  );
};

export default GraphCreate;
