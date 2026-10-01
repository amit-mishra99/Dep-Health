import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { exampleManifest } from "../constants/exampleManifest.js";
import {
  fetchGitHubManifest,
  scanManifest,
} from "../services/dependencyScanner.js";
import { parseDependencyInput } from "../services/manifestParser.js";
import { decodeSharedReport } from "../utils/report.js";

export const runDependencyScan = createAsyncThunk(
  "scan/runDependencyScan",
  async (_, { dispatch, getState }) => {
    const { sourceType, manifestText, repoUrl } = getState().scan;
    let manifest;
    let sourceName;
    let resolvedVersions = {};

    dispatch(setScanMessage("Reading dependency manifest"));
    if (sourceType === "repository") {
      dispatch(setScanMessage("Fetching public GitHub repository"));
      const result = await fetchGitHubManifest(repoUrl.trim());
      manifest = result.manifest;
      sourceName = result.repoName;
    } else {
      const parsedInput = parseDependencyInput(manifestText);
      manifest = parsedInput.manifest;
      resolvedVersions = parsedInput.resolvedVersions;
      sourceName = manifest.name;
    }

    dispatch(setScanMessage("Checking npm metadata and known advisories"));
    const report = await scanManifest(
      manifest,
      sourceName,
      resolvedVersions,
      (scanProgress) => dispatch(setScanProgress(scanProgress)),
    );
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    return report;
  },
);

const initialState = {
  sourceType: "manifest",
  manifestText: exampleManifest,
  repoUrl: "",
  report: decodeSharedReport(),
  status: "idle",
  scanMessage: "",
  scanProgress: { completed: 0, total: 0 },
  error: "",
};

const scanSlice = createSlice({
  name: "scan",
  initialState,
  reducers: {
    setSourceType(state, action) {
      state.sourceType = action.payload;
      state.error = "";
    },
    setManifestText(state, action) {
      state.manifestText = action.payload;
      state.error = "";
    },
    setRepoUrl(state, action) {
      state.repoUrl = action.payload;
      state.error = "";
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setScanMessage(state, action) {
      state.scanMessage = action.payload;
    },
    setScanProgress(state, action) {
      state.scanProgress = action.payload;
    },
    setSharedReport(state, action) {
      state.report = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(runDependencyScan.pending, (state) => {
        state.status = "loading";
        state.error = "";
        state.scanMessage = "";
        state.scanProgress = { completed: 0, total: 0 };
      })
      .addCase(runDependencyScan.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.report = action.payload;
        state.scanMessage = "";
        state.scanProgress = { completed: 0, total: 0 };
      })
      .addCase(runDependencyScan.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.error.message || "The scan could not be completed.";
        state.scanMessage = "";
        state.scanProgress = { completed: 0, total: 0 };
      });
  },
});

export const {
  setSourceType,
  setManifestText,
  setRepoUrl,
  setError,
  setScanMessage,
  setScanProgress,
  setSharedReport,
} = scanSlice.actions;

export default scanSlice.reducer;
