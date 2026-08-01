import { useState, useEffect } from "react";
import API from "../api";

/**
 * Custom hook to manage all app state and handlers
 * Encapsulates auth, subjects, units, topics, videos, and form state
 *
 * NOTE: the admin onboarding state/handler that used to live here
 * (adminUsername, adminRole, handleOnboardStaff, etc.) has been removed.
 * That form was a duplicate of frontend/src/AdminProvisioning.jsx, which is
 * now the single source of truth for admin onboarding and manages its own
 * state internally (it also supports assigning teachers to multiple
 * curricula, which the old inline form here did not).
 */
export const useAppState = () => {
  // Auth State
  const [user, setUser] = useState(null);

  // Content Navigation State
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);

  // Loading State
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Form State (Teacher Video Upload)
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [formTopicId, setFormTopicId] = useState("");
  const [formUnits, setFormUnits] = useState([]);
  const [formTopics, setFormTopics] = useState([]);
  const [videoTitle, setVideoTitle] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [sequenceOrder, setSequenceOrder] = useState("1");
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Global Error State
  const [error, setError] = useState(null);

  // Check if session exists on boot
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Fetch subjects when user changes
  useEffect(() => {
    if (!user) return;

    const fetchSubjects = async () => {
      try {
        const response = await API.get("/resources/subjects");
        if (response.data.success) setSubjects(response.data.data);
      } catch (err) {
        console.error(err);
        setError(
          "Could not pull curriculum workspaces. Check database access keys.",
        );
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [user]);

  // Handler: Select subject for student navigation
  const handleSelectSubject = async (subject) => {
    setSelectedSubject(subject);
    setLoadingUnits(true);
    setUnits([]);
    setSelectedUnit(null);
    setTopics([]);
    setSelectedTopic(null);
    setVideos([]);
    setActiveVideo(null);

    try {
      const response = await API.get(
        `/resources/subjects/${subject.subject_id}/units`,
      );
      if (response.data.success) setUnits(response.data.data);
    } catch (err) {
      console.error(err);
      setError("Error pulling chapters for this subject.");
    } finally {
      setLoadingUnits(false);
    }
  };

  // Handler: Select unit for student navigation
  const handleSelectUnit = async (unit) => {
    setSelectedUnit(unit);
    setLoadingTopics(true);
    setTopics([]);
    setSelectedTopic(null);
    setVideos([]);
    setActiveVideo(null);

    try {
      const response = await API.get(`/resources/units/${unit.unit_id}/topics`);
      if (response.data.success) setTopics(response.data.data);
    } catch (err) {
      console.error(err);
      setError("Error pulling target lesson topics for this chapter.");
    } finally {
      setLoadingTopics(false);
    }
  };

  // Handler: Select topic for student navigation
  const handleSelectTopic = async (topic) => {
    setSelectedTopic(topic);
    setLoadingVideos(true);
    setVideos([]);
    setActiveVideo(null);

    try {
      const response = await API.get(
        `/resources/topics/${topic.topic_id}/videos`,
      );
      if (response.data.success) {
        const videoData = response.data.data;
        setVideos(videoData);
        if (videoData.length > 0) {
          setActiveVideo(videoData[0]);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to resolve uploaded video records for this topic.");
    } finally {
      setLoadingVideos(false);
    }
  };

  // Handler: Form cascade step 1 (subject selection)
  const handleFormSubjectChange = async (subjectId) => {
    setSelectedSubjectId(subjectId);
    setSelectedUnitId("");
    setFormTopicId("");
    setFormUnits([]);
    setFormTopics([]);
    if (!subjectId) return;

    try {
      const res = await API.get(`/resources/subjects/${subjectId}/units`);
      if (res.data.success) setFormUnits(res.data.data);
    } catch (err) {
      console.error(err);
      setFormError("Failed to fetch units for the selected subject.");
    }
  };

  // Handler: Form cascade step 2 (unit selection)
  const handleFormUnitChange = async (unitId) => {
    setSelectedUnitId(unitId);
    setFormTopicId("");
    setFormTopics([]);
    if (!unitId) return;

    try {
      const res = await API.get(`/resources/units/${unitId}/topics`);
      if (res.data.success) setFormTopics(res.data.data);
    } catch (err) {
      console.error(err);
      setFormError("Failed to fetch topics for the selected unit.");
    }
  };

  // Handler: Upload video
  //
  // BUG FIX: this used to POST to "/resources/videos", a route that does
  // not exist on the backend (the real route is
  // "/resources/topics/:topicId/videos") — so this button always failed
  // with a 404. It now calls the correct URL, with topicId in the path
  // instead of the body, matching resourceRoutes.js.
  const handleUploadVideo = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setUploading(true);
    try {
      const response = await API.post(
        `/resources/topics/${formTopicId}/videos`,
        {
          title: videoTitle,
          youtube_video_id: youtubeId,
          sequence_order: parseInt(sequenceOrder, 10),
        },
      );
      if (response.data.success) {
        setFormSuccess("Video resource added successfully!");
        setVideoTitle("");
        setYoutubeId("");
        setSequenceOrder("1");
      }
    } catch (err) {
      console.error(err);
      setFormError(
        err.response?.data?.error || "Failed to publish video asset metadata.",
      );
    } finally {
      setUploading(false);
    }
  };

  // Handler: Logout
  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setSubjects([]);
    setSelectedSubject(null);
    setUnits([]);
    setSelectedUnit(null);
    setTopics([]);
    setSelectedTopic(null);
    setVideos([]);
    setActiveVideo(null);
    setError(null);
  };

  return {
    // Auth
    user,
    setUser,
    // Navigation
    subjects,
    selectedSubject,
    units,
    selectedUnit,
    topics,
    selectedTopic,
    videos,
    activeVideo,
    setActiveVideo,
    // Loading
    loadingSubjects,
    loadingUnits,
    loadingTopics,
    loadingVideos,
    // Form State (Teacher)
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
    // Global
    error,
    setError,
    // Handlers
    handleSelectSubject,
    handleSelectUnit,
    handleSelectTopic,
    handleFormSubjectChange,
    handleFormUnitChange,
    handleUploadVideo,
    handleLogout,
  };
};
