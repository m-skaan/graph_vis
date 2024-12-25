import React, { useEffect, useRef, useState } from "react";
import chroma from "chroma-js";
import Graph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";
import Sigma from "sigma";
import { v4 as uuid } from "uuid";

const GraphCreate = () => {
  const containerRef = useRef(null); // Create a reference for the container
  const [inputValue, setInputValue] = useState(
    "A->B,C,D\nB->A,C,D\nC->A,B\nD->A,B" // Example input
  ); // State to store input
  const [graph, setGraph] = useState(new Graph()); // Store the graph instance in state
  const [renderer, setRenderer] = useState(null); // To store the Sigma renderer

  // This effect will run once when the component mounts
  useEffect(() => {
    if (!containerRef.current || !graph) return;

    // Create the Sigma renderer
    const newRenderer = new Sigma(graph, containerRef.current, {
      minCameraRatio: 0.5,
      maxCameraRatio: 2,
      nodeLabel: 'label', // Use the 'label' property for rendering node labels
    });

    // Create the layout and start it
    const layout = new ForceSupervisor(graph, { isNodeFixed: (_, attr) => attr.highlighted });
    layout.start();

    // Drag'n'drop logic
    let draggedNode = null;
    let isDragging = false;

    newRenderer.on("downNode", (e) => {
      isDragging = true;
      draggedNode = e.node;
      graph.setNodeAttribute(draggedNode, "highlighted", true);
      if (!newRenderer.getCustomBBox()) newRenderer.setCustomBBox(newRenderer.getBBox());
    });

    newRenderer.on("moveBody", (e) => {
      if (!isDragging || !draggedNode) return;
      const pos = newRenderer.viewportToGraph(e);
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
    newRenderer.on("upNode", handleUp);
    newRenderer.on("upStage", handleUp);

    return () => {
      // Cleanup the renderer when the component is unmounted
      newRenderer.kill();
    };
  }, [graph]); // Re-run effect when the `graph` state changes

  // Handle the input change
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  // Handle the form submit (parsing adjacency list)
  const handleSubmit = (event) => {
    event.preventDefault();

    // Create a new empty graph
    const newGraph = new Graph();
    setGraph(newGraph); // Set the new graph state

    // Parse the input as an adjacency list
    const adjacencyList = inputValue.split("\n").map((line) => {
      const [node, neighbors] = line.split("->");
      return { node, neighbors: neighbors.split(",").map((n) => n.trim()) };
    });

    console.log("Parsed Adjacency List: ", adjacencyList);

    const edgesToAdd = [];

    // Loop through the adjacency list and add nodes/edges to the new graph
    adjacencyList.forEach(({ node, neighbors }) => {
      // Add the node if it doesn't exist already
      if (!newGraph.hasNode(node)) {
        newGraph.addNode(node, {
          x: Math.random() * 10, 
          y: Math.random() * 10, 
          size: 10, 
          color: chroma.random().hex(),
          label: node, // Add the label (using the node name as the label)
        });
      }

      // Loop through neighbors and find valid edges
      neighbors.forEach((neighbor) => {
        if (!newGraph.hasNode(neighbor)) {
          newGraph.addNode(neighbor, {
            x: Math.random() * 10, 
            y: Math.random() * 10, 
            size: 10, 
            color: chroma.random().hex(),
            label: neighbor, // Add the label (using the neighbor name as the label)
          });
        }
        
        // Add the edge to the list (we will check if it exists in both directions)
        edgesToAdd.push({ node, neighbor });
      });
    });

    // Filter valid edges (edges that appear in both directions)
    const validEdges = edgesToAdd.filter(
      ({ node, neighbor }) =>
        edgesToAdd.some(
          (e) => e.node === neighbor && e.neighbor === node
        )
    );

    // Add only the valid edges to the graph
    validEdges.forEach(({ node, neighbor }) => {
      newGraph.addEdge(node, neighbor);
    });

    // After setting the new graph, force the effect to re-run to reinitialize Sigma renderer
    setGraph(newGraph);
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
      <div style={{ padding: "10px", backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
        Adjacency List
      </div>
      {/* Textbox area */}
      <form onSubmit={handleSubmit} style={{ padding: "10px", backgroundColor: "#fff", flexShrink: 0}}>
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
