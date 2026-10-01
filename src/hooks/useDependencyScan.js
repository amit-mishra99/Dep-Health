import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { parseDependencyInput } from "../services/manifestParser.js";
import {
  runDependencyScan,
  setError,
  setManifestText,
  setRepoUrl,
  setSharedReport,
  setSourceType,
} from "../store/scanSlice.js";
import { decodeSharedReport } from "../utils/report.js";

export function useDependencyScan() {
  const dispatch = useDispatch();
  const scanState = useSelector((state) => state.scan);

  useEffect(() => {
    const loadSharedReport = () => {
      const sharedReport = decodeSharedReport();
      if (sharedReport) dispatch(setSharedReport(sharedReport));
    };
    window.addEventListener("hashchange", loadSharedReport);
    return () => window.removeEventListener("hashchange", loadSharedReport);
  }, [dispatch]);

  const scan = useCallback(
    (event) => {
      event.preventDefault();
      dispatch(runDependencyScan());
    },
    [dispatch],
  );

  const uploadManifest = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!/^package(?:-lock)?\.json$/i.test(file.name)) {
        dispatch(
          setError(
            "Choose a file named package.json or package-lock.json. Other files are not accepted.",
          ),
        );
        event.target.value = "";
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        dispatch(
          setError(
            "That file is larger than 10 MB. Paste a smaller package file or choose a trimmed lockfile.",
          ),
        );
        event.target.value = "";
        return;
      }
      try {
        const fileText = await file.text();
        parseDependencyInput(fileText, file.name);
        dispatch(setManifestText(fileText));
        dispatch(setSourceType("manifest"));
      } catch (uploadError) {
        dispatch(
          setError(
            uploadError.message ||
              "That file could not be read. Choose package.json or package-lock.json.",
          ),
        );
      }
      event.target.value = "";
    },
    [dispatch],
  );

  return {
    ...scanState,
    isScanning: scanState.status === "loading",
    setSourceType: (value) => dispatch(setSourceType(value)),
    setManifestText: (value) => dispatch(setManifestText(value)),
    setRepoUrl: (value) => dispatch(setRepoUrl(value)),
    setError: (value) => dispatch(setError(value)),
    scan,
    uploadManifest,
  };
}
