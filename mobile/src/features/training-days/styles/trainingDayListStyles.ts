import { StyleSheet } from 'react-native';

export const trainingDayListStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  trainingDayContainer: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  trainingDayContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trainingDayText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  ellipsisContainer: {
    position: 'relative',
  },
  menuOptionText: {
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: "#2979FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: 300,
    backgroundColor: "#1F2940",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    color: "#A5A5A5",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtonsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    backgroundColor: "#2979FF",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  // Loading and empty states
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  emptyText: {
    color: "#A5A5A5",
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: "#2979FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});