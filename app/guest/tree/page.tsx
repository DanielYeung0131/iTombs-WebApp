"use client";

import { useState, useEffect, useRef } from "react";
import { User, X, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";

interface TreeNode {
  tree_id: number;
  user_id: number;
  relative_name: string;
  relationship: string;
  profile_url?: string;
}

interface NewRelative {
  relativeName: string;
  relationship: string;
  profileUrl: string;
}

interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  data: TreeNode | null; // null for root node when no data exists
  isRoot?: boolean;
}

interface GraphEdge {
  from: string;
  to: string;
  relationship: string;
}

export default function FamilyTreeVisualization() {
  // Get userId from URL params (you can modify this based on your routing setup)
  // Get userId from the route (e.g., /admin/tree/[userId])

  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setUserId(searchParams.get("userid") || "");
    }
  }, []);

  const [userName] = useState("You"); // You can modify this to get actual user name

  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [newRelative, setNewRelative] = useState<NewRelative>({
    relativeName: "",
    relationship: "",
    profileUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [svgDimensions, setSvgDimensions] = useState({
    width: 800,
    height: 600,
  });
  const [isMobile, setIsMobile] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      fetchTreeData();
    }
  }, [userId]);

  // Handle responsive dimensions and mobile detection
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const windowWidth =
          typeof window !== "undefined" ? window.innerWidth : 1024;
        const isMobileView = windowWidth < 768;

        setIsMobile(isMobileView);

        const width = Math.min(containerWidth - 32, isMobileView ? 350 : 800);
        const height = isMobileView ? 400 : 600;

        setSvgDimensions({ width, height });
      }
    };

    updateDimensions();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }
  }, []);

  const fetchTreeData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tree?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setTreeData(data);
      } else {
        console.error("Failed to fetch tree data");
        // Fallback to empty array if API fails
        setTreeData([]);
      }
    } catch (error) {
      console.error("Error fetching tree data:", error);
      // Fallback to empty array if API fails
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate graph layout - always includes root node
  const generateLayout = (
    data: TreeNode[]
  ): { nodes: GraphNode[]; edges: GraphEdge[] } => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const centerX = svgDimensions.width / 2;
    const centerY = svgDimensions.height / 2 + 65;
    const baseRadius = isMobile ? 80 : 150;

    // Always create root node
    const rootNode = data.find((n) => n.relationship === "self");
    const rootNodeData: GraphNode = {
      id: "root-node",
      name: rootNode ? rootNode.relative_name : userName,
      x: centerX,
      y: centerY,
      data: rootNode || null,
      isRoot: true,
    };
    nodes.push(rootNodeData);

    // If no data, return just the root node
    if (data.length === 0) {
      return { nodes, edges };
    }

    // Position other nodes in layers around the root
    const relationshipLayers = {
      spouse: { angle: 0, distance: isMobile ? 100 : 160 },
      parent: { angle: -90, distance: isMobile ? 140 : 240 },
      child: { angle: 90, distance: isMobile ? 140 : 240 },
      sibling: { angle: 180, distance: isMobile ? 120 : 200 },
      grandparent: { angle: -90, distance: isMobile ? 180 : 340 },
      grandchild: { angle: 90, distance: isMobile ? 180 : 340 },
      aunt: { angle: -135, distance: isMobile ? 150 : 260 },
      uncle: { angle: -45, distance: isMobile ? 150 : 260 },
      cousin: { angle: 135, distance: isMobile ? 150 : 260 },
      nephew: { angle: 45, distance: isMobile ? 150 : 260 },
      niece: { angle: 45, distance: isMobile ? 160 : 280 },
    };

    const relationshipCounts: Record<string, number> = {};

    data.forEach((relative) => {
      // Skip the root node if it exists in data
      if (relative.relationship === "self") return;

      const relationship = relative.relationship.toLowerCase();
      relationshipCounts[relationship] =
        (relationshipCounts[relationship] || 0) + 1;
      const index = relationshipCounts[relationship] - 1;

      const config = relationshipLayers[
        relationship as keyof typeof relationshipLayers
      ] || { angle: Math.random() * 360, distance: isMobile ? 100 : 200 };

      // Enhanced spacing for parents - more angle difference for two parents
      let angleOffset;
      if (relationship === "parent" && relationshipCounts[relationship] === 2) {
        // For two parents, spread them wider apart
        angleOffset = index * (isMobile ? 50 : 60) - (isMobile ? 25 : 30);
      } else {
        // Standard spacing for other relationships
        angleOffset =
          index * (isMobile ? 20 : 30) -
          (relationshipCounts[relationship] - 1) * (isMobile ? 10 : 15);
      }

      const finalAngle = (config.angle + angleOffset) * (Math.PI / 180);

      const x = centerX + Math.cos(finalAngle) * config.distance;
      const y = centerY + Math.sin(finalAngle) * config.distance;

      // Ensure nodes stay within bounds
      const nodeRadius = isMobile ? 20 : 30;
      const clampedX = Math.max(
        nodeRadius,
        Math.min(svgDimensions.width - nodeRadius, x)
      );
      const clampedY = Math.max(
        nodeRadius,
        Math.min(svgDimensions.height - nodeRadius, y)
      );

      const nodeId = `node-${relative.tree_id}`;
      nodes.push({
        id: nodeId,
        name: relative.relative_name,
        x: clampedX,
        y: clampedY,
        data: relative,
      });

      // Create edge from root to this node
      edges.push({
        from: "root-node",
        to: nodeId,
        relationship: relative.relationship,
      });
    });

    return { nodes, edges };
  };

  const { nodes, edges } = generateLayout(treeData);

  const handleNodeClick = (node: GraphNode) => {
    // Don't allow clicking on root node if it has no data
    if (node.isRoot && !node.data) return;
    setSelectedNode(node);
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button === 0) {
      // Left click
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          setDraggedNode(nodeId);
          setDragOffset({
            x: e.clientX - rect.left - node.x,
            y: e.clientY - rect.top - node.y,
          });
        }
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent, nodeId: string) => {
    const touch = e.touches[0];
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect && touch) {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setDraggedNode(nodeId);
        setDragOffset({
          x: touch.clientX - rect.left - node.x,
          y: touch.clientY - rect.top - node.y,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const nodeIndex = nodes.findIndex((n) => n.id === draggedNode);
        if (nodeIndex !== -1) {
          const newX = e.clientX - rect.left - dragOffset.x;
          const newY = e.clientY - rect.top - dragOffset.y;

          const nodeRadius = nodes[nodeIndex].isRoot ? 35 : 30;
          nodes[nodeIndex].x = Math.max(
            nodeRadius,
            Math.min(svgDimensions.width - nodeRadius, newX)
          );
          nodes[nodeIndex].y = Math.max(
            nodeRadius,
            Math.min(svgDimensions.height - nodeRadius, newY)
          );
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedNode) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect && touch) {
        const nodeIndex = nodes.findIndex((n) => n.id === draggedNode);
        if (nodeIndex !== -1) {
          const newX = touch.clientX - rect.left - dragOffset.x;
          const newY = touch.clientY - rect.top - dragOffset.y;

          const nodeRadius = nodes[nodeIndex].isRoot ? 35 : 30;
          nodes[nodeIndex].x = Math.max(
            nodeRadius,
            Math.min(svgDimensions.width - nodeRadius, newX)
          );
          nodes[nodeIndex].y = Math.max(
            nodeRadius,
            Math.min(svgDimensions.height - nodeRadius, newY)
          );
        }
      }
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleTouchEnd = () => {
    setDraggedNode(null);
  };

  const addRelative = async () => {
    if (!newRelative.relativeName || !newRelative.relationship) return;

    try {
      setSubmitting(true);
      const response = await fetch("/api/tree", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          relativeName: newRelative.relativeName,
          relationship: newRelative.relationship,
          profileUrl: newRelative.profileUrl || null,
        }),
      });

      if (response.ok) {
        setNewRelative({ relativeName: "", relationship: "", profileUrl: "" });
        setShowAddForm(false);
        fetchTreeData(); // Refresh the tree data
      } else {
        console.error("Failed to add relative");
      }
    } catch (error) {
      console.error("Error adding relative:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRelative = async (treeId: number) => {
    if (!confirm("Are you sure you want to delete this relative?")) return;

    try {
      const response = await fetch(`/api/tree?treeId=${treeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTreeData(); // Refresh the tree data
        setSelectedNode(null); // Close the modal
      } else {
        console.error("Failed to delete relative");
      }
    } catch (error) {
      console.error("Error deleting relative:", error);
    }
  };

  const handleBackToDashboard = () => {
    if (typeof window !== "undefined") {
      window.location.href = `/guest?user=${userId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Enhanced Header */}
        <div className="flex flex-row items-center justify-between mb-6 sm:mb-10 gap-2 flex-wrap">
          {/* Left: Back Button */}
          <button
            onClick={handleBackToDashboard}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-full shadow hover:from-blue-600 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Back</span>
          </button>

          {/* Center: Title & Subtitle */}
          <div className="flex flex-col items-center flex-1 min-w-[180px]">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 text-center w-full tracking-tight">
              Family Tree Builder
            </h1>
            {/* <span className="text-sm sm:text-base text-gray-500 mt-1 text-center">
              Visualize and manage your family connections
            </span> */}
          </div>

          {/* Right: Add Button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-green-400 via-blue-500 to-blue-700 text-white font-semibold rounded-full shadow-lg hover:from-green-500 hover:via-blue-600 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="tracking-wide">Add Relative</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Family Tree Visualization - Always shows root node */}
        {!loading && (
          <div
            className="bg-white rounded-lg shadow-lg p-2 sm:p-6 h-[600px] overflow-y-auto"
            ref={containerRef}
          >
            {treeData.length === 0 && (
              <div className="text-center mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 font-medium text-sm sm:text-base">
                  Start building your family tree by adding relatives!
                </p>
                <p className="text-blue-600 text-xs sm:text-sm mt-1">
                  Click "Add" to connect family members to your tree.
                </p>
              </div>
            )}

            <div className="relative flex justify-center">
              <svg
                ref={svgRef}
                width={svgDimensions.width}
                height={svgDimensions.height}
                className="rounded-lg touch-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ maxWidth: "100%" }}
              >
                {/* Edges */}
                {edges.map((edge, index) => {
                  const fromNode = nodes.find((n) => n.id === edge.from);
                  const toNode = nodes.find((n) => n.id === edge.to);
                  if (!fromNode || !toNode) return null;

                  const midX = (fromNode.x + toNode.x) / 2;
                  const midY = (fromNode.y + toNode.y) / 2;
                  const labelWidth = isMobile ? 50 : 60;
                  const labelHeight = isMobile ? 16 : 20;

                  return (
                    <g key={index}>
                      <line
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke="#94A3B8"
                        strokeWidth="2"
                        className="transition-colors"
                      />
                      <rect
                        x={midX - labelWidth / 2}
                        y={midY - labelHeight / 2}
                        width={labelWidth}
                        height={labelHeight}
                        fill="white"
                        stroke="#E2E8F0"
                        rx="4"
                      />
                      <text
                        x={midX}
                        y={midY + (isMobile ? 2 : 4)}
                        textAnchor="middle"
                        className={`${
                          isMobile ? "text-xs" : "text-xs"
                        } fill-gray-600 font-medium`}
                      >
                        {edge.relationship}
                      </text>
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                  const nodeRadius = node.isRoot
                    ? isMobile
                      ? 30
                      : 35
                    : isMobile
                    ? 25
                    : 30;
                  const iconSize = node.isRoot
                    ? isMobile
                      ? 18
                      : 24
                    : isMobile
                    ? 15
                    : 20;
                  const isHovered = hoveredNode === node.id;

                  return (
                    <g
                      key={node.id}
                      className={
                        node.isRoot && !node.data
                          ? "cursor-default"
                          : "cursor-pointer"
                      }
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={nodeRadius}
                        fill={node.isRoot ? "#3B82F6" : "#10B981"}
                        stroke="white"
                        strokeWidth="3"
                        className={`transition-all duration-200 ${
                          isHovered ? "shadow-lg filter drop-shadow-lg" : ""
                        }`}
                        style={{
                          transform: isHovered ? "scale(1.1)" : "scale(1)",
                          transformOrigin: `${node.x}px ${node.y}px`,
                          filter: isHovered
                            ? "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))"
                            : "none",
                        }}
                        onClick={() => handleNodeClick(node)}
                        onMouseDown={(e) => handleMouseDown(e, node.id)}
                        onTouchStart={(e) => handleTouchStart(e, node.id)}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                      />

                      {/* User icon - no profile images */}
                      <User
                        x={node.x - iconSize / 2}
                        y={node.y - iconSize / 2}
                        width={iconSize}
                        height={iconSize}
                        className={`fill-white pointer-events-none transition-all duration-200 ${
                          isHovered ? "opacity-90" : "opacity-100"
                        }`}
                        style={{
                          transform: isHovered ? "scale(1.1)" : "scale(1)",
                          transformOrigin: `${node.x}px ${node.y}px`,
                        }}
                      />

                      {/* Name label */}
                      <text
                        x={node.x}
                        y={node.y + nodeRadius + (isMobile ? 12 : 15)}
                        textAnchor="middle"
                        className={`${
                          isMobile ? "text-xs" : "text-sm"
                        } font-medium fill-gray-700 pointer-events-none transition-all duration-200 ${
                          isHovered ? "font-bold" : ""
                        }`}
                        style={{
                          transform: isHovered ? "scale(1.05)" : "scale(1)",
                          transformOrigin: `${node.x}px ${
                            node.y + nodeRadius + (isMobile ? 12 : 15)
                          }px`,
                        }}
                      >
                        {isMobile && node.name.length > 8
                          ? node.name.substring(0, 8) + "..."
                          : node.name}
                      </text>

                      {node.isRoot && (
                        <text
                          x={node.x}
                          y={node.y + nodeRadius + (isMobile ? 24 : 30)}
                          textAnchor="middle"
                          className={`${
                            isMobile ? "text-xs" : "text-xs"
                          } fill-blue-600 font-medium pointer-events-none transition-all duration-200 ${
                            isHovered ? "font-bold" : ""
                          }`}
                          style={{
                            transform: isHovered ? "scale(1.05)" : "scale(1)",
                            transformOrigin: `${node.x}px ${
                              node.y + nodeRadius + (isMobile ? 24 : 30)
                            }px`,
                          }}
                        >
                          (You)
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* Node Details Modal */}
        {selectedNode && selectedNode.data && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {selectedNode.name}
                </h2>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Relationship
                  </label>
                  <p className="text-gray-900 capitalize">
                    {selectedNode.data.relationship}
                  </p>
                </div>

                {selectedNode.data.profile_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Profile Link
                    </label>
                    <a
                      href={selectedNode.data.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm break-all underline"
                    >
                      {selectedNode.data.profile_url}
                    </a>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <button
                    onClick={() => deleteRelative(selectedNode.data!.tree_id)}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Relative</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Relative Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                Add New Relative
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newRelative.relativeName}
                    onChange={(e) =>
                      setNewRelative({
                        ...newRelative,
                        relativeName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship *
                  </label>
                  <select
                    value={newRelative.relationship}
                    onChange={(e) =>
                      setNewRelative({
                        ...newRelative,
                        relationship: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    required
                  >
                    <option value="">Select relationship</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="sibling">Sibling</option>
                    <option value="spouse">Spouse</option>
                    <option value="grandparent">Grandparent</option>
                    <option value="grandchild">Grandchild</option>
                    <option value="aunt">Aunt</option>
                    <option value="uncle">Uncle</option>
                    <option value="cousin">Cousin</option>
                    <option value="nephew">Nephew</option>
                    <option value="niece">Niece</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Link (optional)
                  </label>
                  <input
                    type="url"
                    value={newRelative.profileUrl}
                    onChange={(e) =>
                      setNewRelative({
                        ...newRelative,
                        profileUrl: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="https://example.com/"
                  />
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="w-full sm:flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addRelative}
                    disabled={submitting}
                    className="w-full sm:flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Adding..." : "Add Relative"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
