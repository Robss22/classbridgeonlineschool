import React from "react";
import Auth from "./Auth";
import AdminProvisioning from "./AdminProvisioning";
import { useAppState } from "./hooks/useAppState";

function App() {
  const {
    user,
    setUser,
    subjects,
    selectedSubject,
    units,
    selectedUnit,
    topics,
    selectedTopic,
    videos,
    activeVideo,
    setActiveVideo,
    loadingSubjects,
    loadingUnits,
    loadingTopics,
    loadingVideos,
    selectedSubjectId,
    selectedUnitId,
    formTopicId,
    setFormTopicId,
    formUnits,
    formTopics,
    videoTitle,
    setVideoTitle,
    youtubeId,
    setYoutubeId,
    sequenceOrder,
    setSequenceOrder,
    formSuccess,
    formError,
    uploading,
    error,
    handleSelectSubject,
    handleSelectUnit,
    handleSelectTopic,
    handleFormSubjectChange,
    handleFormUnitChange,
    handleUploadVideo,
    handleLogout,
  } = useAppState();

  if (!user) {
    return <Auth onAuthSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  // Admins get the dedicated provisioning screen instead of the
  // subject/unit/topic browser — onboarding staff and enrolling students
  // is their primary job here. AdminProvisioning manages its own form
  // state internally and supports multi-curriculum teacher assignment
  // (the old inline admin form in this file did not, and has been removed).
  if (user.role === "admin") {
    return <AdminProvisioning onLogout={handleLogout} />;
  }

  return (
    <div className="cb-container" style={styles.container}>
      <header className="cb-header" style={styles.header}>
        <div>
          <h1 className="cb-title" style={styles.title}>
            ClassBridge School
          </h1>
          <p style={styles.subtitle}>Syllabus Resource & Dashboard Space</p>
        </div>
        <div style={styles.userProfile}>
          <div style={{ textAlign: "right" }}>
            <span style={styles.profileLabel}>Active Profile:</span>
            <div style={styles.profileName}>
              {user.username} ({user.role})
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Log Out
          </button>
        </div>
      </header>

      {error && <div style={styles.errorAlert}>{error}</div>}

      {user.role === "teacher" && (
        <div style={styles.managementPanel}>
          <h2 style={styles.panelTitle}>
            ⚙️ Teacher Curriculum Management Control
          </h2>
          {formSuccess && <div style={styles.successMsg}>{formSuccess}</div>}
          {formError && <div style={styles.errorMsg}>{formError}</div>}

          <form onSubmit={handleUploadVideo} style={styles.form}>
            <div className="cb-form-grid" style={styles.formGrid}>
              <div>
                <label style={styles.label}>1. Choose Subject Context</label>
                <select
                  required
                  value={selectedSubjectId}
                  onChange={(e) => handleFormSubjectChange(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- Select Subject Workspace --</option>
                  {subjects.map((s) => (
                    <option key={s.subject_id} value={s.subject_id}>
                      {s.curriculum_id === 1 ? "Cambridge" : "UNEB"} | {s.name}{" "}
                      ({s.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>2. Choose Unit / Chapter</label>
                <select
                  required
                  disabled={!selectedSubjectId}
                  value={selectedUnitId}
                  onChange={(e) => handleFormUnitChange(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- Choose Unit --</option>
                  {formUnits.map((u) => (
                    <option key={u.unit_id} value={u.unit_id}>
                      Unit {u.unit_number}: {u.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>3. Target Lesson Topic</label>
                <select
                  required
                  disabled={!selectedUnitId}
                  value={formTopicId}
                  onChange={(e) => setFormTopicId(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- Choose Topic --</option>
                  {formTopics.map((t) => (
                    <option key={t.topic_id} value={t.topic_id}>
                      {t.topic_code}: {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="cb-form-row" style={styles.formRow}>
              <div>
                <label style={styles.label}>Lesson Video Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Understanding Network Topologies"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>YouTube Link or Video ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., mgNPIoN2y6I"
                  value={youtubeId}
                  onChange={(e) => setYoutubeId(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Order</label>
                <input
                  type="number"
                  placeholder="1"
                  value={sequenceOrder}
                  onChange={(e) => setSequenceOrder(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={uploading || !formTopicId}
                  style={{ ...styles.submitBtn, marginTop: "25px" }}
                >
                  {uploading ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div style={styles.mainContent}>
        <div>
          <h2 style={styles.sectionTitle}>Your Allocated Workspaces</h2>
          {loadingSubjects ? (
            <p>Loading curriculum views...</p>
          ) : (
            <div className="cb-subjects-grid" style={styles.subjectsGrid}>
              {subjects.length === 0 ? (
                <p style={styles.noData}>
                  No subjects found matching your active profile parameters.
                </p>
              ) : (
                subjects.map((subject) => {
                  const isSelected =
                    selectedSubject?.subject_id === subject.subject_id;
                  return (
                    <div
                      key={subject.subject_id}
                      onClick={() => handleSelectSubject(subject)}
                      style={{
                        ...styles.subjectCard,
                        boxShadow: isSelected
                          ? "0 0 0 3px #3498db"
                          : styles.subjectCard.boxShadow,
                        borderLeftColor:
                          subject.curriculum_id === 1 ? "#3498db" : "#2ecc71",
                      }}
                    >
                      <span
                        style={{
                          ...styles.badge,
                          color:
                            subject.curriculum_id === 1 ? "#3498db" : "#2ecc71",
                          backgroundColor:
                            subject.curriculum_id === 1 ? "#e8f4fd" : "#eafaf1",
                        }}
                      >
                        {subject.curriculum_id === 1 ? "Cambridge" : "UNEB"}
                      </span>
                      <h3 style={styles.subjectName}>{subject.name}</h3>
                      <p style={styles.subjectLevel}>
                        Level: <strong>{subject.level}</strong>
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {selectedSubject && (
          <div className="cb-dual-column" style={styles.dualColumn}>
            <div style={styles.navPanel}>
              <h3 style={styles.panelHeader}>
                📖 Chapters: {selectedSubject.name}
              </h3>
              {loadingUnits && <p>Loading syllabus chapters...</p>}
              {!loadingUnits && units.length === 0 && (
                <p style={styles.noData}>No chapters uploaded here yet.</p>
              )}

              <div style={styles.unitsList}>
                {units.map((unit) => {
                  const isUnitSelected = selectedUnit?.unit_id === unit.unit_id;
                  return (
                    <div
                      key={unit.unit_id}
                      style={{
                        ...styles.unitItem,
                        borderColor: isUnitSelected ? "#e67e22" : "#e2e8f0",
                      }}
                    >
                      <div
                        onClick={() => handleSelectUnit(unit)}
                        style={{
                          ...styles.unitHeader,
                          backgroundColor: isUnitSelected
                            ? "#fff9f2"
                            : "#f8f9fa",
                        }}
                      >
                        <small style={styles.unitNumber}>
                          Unit {unit.unit_number}
                        </small>
                        <strong>{unit.title}</strong>
                      </div>

                      {isUnitSelected && (
                        <div style={styles.topicsContainer}>
                          {loadingTopics && (
                            <p style={styles.smallText}>Loading topics...</p>
                          )}
                          {!loadingTopics && topics.length === 0 && (
                            <p
                              style={{
                                ...styles.smallText,
                                fontStyle: "italic",
                              }}
                            >
                              No sub-topics logged yet.
                            </p>
                          )}

                          {topics.map((topic) => {
                            const isTopicSelected =
                              selectedTopic?.topic_id === topic.topic_id;
                            return (
                              <button
                                key={topic.topic_id}
                                type="button"
                                onClick={() => handleSelectTopic(topic)}
                                style={{
                                  ...styles.topicBtn,
                                  backgroundColor: isTopicSelected
                                    ? "#34495e"
                                    : "#f1f5f9",
                                  color: isTopicSelected ? "#fff" : "#475569",
                                  fontWeight: isTopicSelected
                                    ? "bold"
                                    : "normal",
                                }}
                              >
                                <span>
                                  {topic.topic_code} {topic.title}
                                </span>
                                <span>➡️</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={styles.videoPanel}>
              {selectedTopic ? (
                <div>
                  <span style={styles.topicBadge}>
                    Active Target: {selectedTopic.topic_code}
                  </span>
                  <h3 style={styles.topicTitle}>{selectedTopic.title}</h3>

                  {loadingVideos && (
                    <p>Assembling video lecture resources...</p>
                  )}

                  {activeVideo ? (
                    <div>
                      <div style={styles.videoContainer}>
                        <iframe
                          style={styles.iframe}
                          src={`https://www.youtube.com/embed/${activeVideo.youtube_video_id}?rel=0&modestbranding=1`}
                          title={activeVideo.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                      <h4 style={styles.playingTitle}>
                        🎥 Currently Playing: {activeVideo.title}
                      </h4>

                      {videos.length > 1 && (
                        <div style={styles.playlistContainer}>
                          <h5 style={styles.playlistTitle}>
                            Topic Video Index:
                          </h5>
                          <div style={styles.playlistItems}>
                            {videos.map((vid) => (
                              <div
                                key={vid.video_id}
                                onClick={() => setActiveVideo(vid)}
                                style={{
                                  ...styles.playlistItem,
                                  backgroundColor:
                                    activeVideo.video_id === vid.video_id
                                      ? "#e8f4fd"
                                      : "#f8f9fa",
                                  borderLeftColor:
                                    activeVideo.video_id === vid.video_id
                                      ? "#3498db"
                                      : "#cbd5e1",
                                  fontWeight:
                                    activeVideo.video_id === vid.video_id
                                      ? "bold"
                                      : "normal",
                                }}
                              >
                                Sequence {vid.sequence_order}: {vid.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    !loadingVideos && (
                      <div style={styles.noVideoPlaceholder}>
                        <span style={{ fontSize: "40px" }}>📺</span>
                        <p>No video lectures cataloged for this topic yet.</p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div style={styles.readyToStudy}>
                  <span style={{ fontSize: "50px", marginBottom: "10px" }}>
                    🎓
                  </span>
                  <h3>Ready to Study</h3>
                  <p>
                    Select a syllabus unit and sub-topic from the tree
                    navigation to load your visual course modules.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    fontFamily: "sans-serif",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
    color: "#2c3e50",
  },
  header: {
    borderBottom: "2px solid #eaeaea",
    paddingBottom: "20px",
    marginBottom: "30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: "2.5rem", margin: "0 0 10px 0", color: "#2c3e50" },
  subtitle: { color: "#7f8c8d", margin: 0, fontSize: "1.1rem" },
  userProfile: { display: "flex", alignItems: "center", gap: "15px" },
  profileLabel: { fontSize: "12px", color: "#7f8c8d" },
  profileName: { fontWeight: "bold" },
  logoutBtn: {
    padding: "8px 15px",
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  errorAlert: {
    backgroundColor: "#fde8e8",
    color: "#e74c3c",
    padding: "15px",
    borderRadius: "5px",
    marginBottom: "20px",
  },
  managementPanel: {
    backgroundColor: "#ffffff",
    padding: "25px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    borderTop: "4px solid #2ecc71",
    marginBottom: "30px",
  },
  panelTitle: { color: "#27ae60", margin: "0 0 20px 0" },
  successMsg: {
    backgroundColor: "#eafaf1",
    color: "#2ecc71",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "15px",
    fontWeight: "bold",
  },
  errorMsg: {
    backgroundColor: "#fde8e8",
    color: "#e74c3c",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "15px",
  },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "3fr 2fr 1fr 1fr",
    gap: "15px",
    alignItems: "end",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "bold",
    marginBottom: "5px",
    color: "#34495e",
  },
  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
  submitBtn: {
    width: "100%",
    padding: "11px",
    backgroundColor: "#2ecc71",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  mainContent: {
    display: "flex",
    gap: "40px",
    flexDirection: "column",
    marginTop: "30px",
  },
  sectionTitle: { color: "#34495e", marginBottom: "20px" },
  subjectsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  noData: { fontStyle: "italic", color: "#7f8c8d" },
  subjectCard: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    borderLeft: "5px solid",
    cursor: "pointer",
  },
  badge: {
    fontSize: "11px",
    textTransform: "uppercase",
    fontWeight: "bold",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  subjectName: { margin: "15px 0 5px 0" },
  subjectLevel: { color: "#7f8c8d", margin: 0, fontSize: "14px" },
  dualColumn: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "30px",
    alignItems: "start",
  },
  navPanel: {
    backgroundColor: "#ffffff",
    padding: "25px",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  panelHeader: {
    margin: "0 0 15px 0",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
    color: "#2c3e50",
  },
  unitsList: { display: "flex", flexDirection: "column", gap: "10px" },
  unitItem: { border: "1px solid", borderRadius: "6px", overflow: "hidden" },
  unitHeader: {
    padding: "12px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  unitNumber: { color: "#e67e22", fontWeight: "bold", display: "block" },
  topicsContainer: {
    backgroundColor: "#ffffff",
    padding: "10px",
    borderTop: "1px solid #edf2f7",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  smallText: { fontSize: "12px", margin: "5px" },
  topicBtn: {
    textAlign: "left",
    padding: "8px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
  },
  videoPanel: {
    backgroundColor: "#ffffff",
    padding: "25px",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    minHeight: "400px",
  },
  topicBadge: {
    fontSize: "11px",
    textTransform: "uppercase",
    fontWeight: "bold",
    color: "#e67e22",
    backgroundColor: "#fff9f2",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  topicTitle: { margin: "10px 0 20px 0", color: "#2c3e50" },
  videoContainer: {
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: "8px",
    backgroundColor: "#000",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  iframe: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    border: 0,
  },
  playingTitle: {
    marginTop: "15px",
    marginBottom: "25px",
    color: "#34495e",
    fontSize: "1.1rem",
  },
  playlistContainer: {
    marginTop: "20px",
    borderTop: "1px solid #eee",
    paddingTop: "15px",
  },
  playlistTitle: { margin: "0 0 10px 0", color: "#7f8c8d" },
  playlistItems: { display: "flex", flexDirection: "column", gap: "8px" },
  playlistItem: {
    padding: "10px",
    borderLeft: "4px solid",
    cursor: "pointer",
    borderRadius: "0 4px 4px 0",
    fontSize: "13px",
  },
  noVideoPlaceholder: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#94a3b8",
    border: "2px dashed #e2e8f0",
    borderRadius: "6px",
  },
  readyToStudy: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: "350px",
    color: "#94a3b8",
    textAlign: "center",
  },
};

export default App;
