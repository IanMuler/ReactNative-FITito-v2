import { StyleSheet } from 'react-native';

export const addTrainingDayStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141A30",
    padding: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 20,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#1F2940",
    color: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 16,
  },
  exercisesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  exerciseCard: {
    backgroundColor: "#1F2940",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "45%",
    marginBottom: 10,
  },
  selectedExerciseCard: {
    backgroundColor: "#394867",
  },
  exerciseImage: {
    width: 50,
    height: 50,
    marginBottom: 10,
    borderRadius: 25,
  },
  exerciseText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2979FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#A5A5A5",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  // Loading state for exercises
  exercisesLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  exercisesLoadingText: {
    color: "#A5A5A5",
    fontSize: 16,
  },
  // Error state for exercises
  exercisesError: {
    backgroundColor: "#FF4444",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  exercisesErrorText: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: 'center',
  },
  // Empty state for exercises
  exercisesEmpty: {
    alignItems: 'center',
    marginTop: 50,
  },
  exercisesEmptyText: {
    color: "#A5A5A5",
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  exercisesEmptyButton: {
    backgroundColor: "#2979FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  exercisesEmptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});