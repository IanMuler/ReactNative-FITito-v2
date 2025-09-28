import { StyleSheet } from 'react-native';

export const exerciseListStyles = StyleSheet.create({
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
  exerciseContainer: {
    width: "100%",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  exerciseContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseImage: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  exerciseText: {
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
  searchContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: "#1F2940",
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 12,
    paddingLeft: 45,
    paddingRight: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2979FF",
  },
  searchIconContainer: {
    position: 'absolute',
    left: 15,
    top: 12,
    zIndex: 1,
  },
  clearIconContainer: {
    position: 'absolute',
    right: 15,
    top: 12,
    zIndex: 1,
  },
});