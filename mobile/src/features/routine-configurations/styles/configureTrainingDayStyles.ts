import { StyleSheet } from 'react-native';

export const configureTrainingDayStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "transparent",
  },
  scrollViewContent: {
    flexGrow: 1,
  },

  exerciseSection: {
    marginBottom: 40,
  },

  exerciseTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },

  exerciseCard: {
    backgroundColor: '#1f2940',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },

  setHeader: {
    marginBottom: 20,
  },

  setLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  inputsSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  inputField: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },

  fieldLabel: {
    color: '#a5a5a5',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#293048',
    borderRadius: 5,
    height: 44,
    position: 'relative',
  },

  controlBtn: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#FFFFFF',
    fontSize: 20,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 44,
    zIndex: 1,
  },

  controlBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'normal',
  },

  setInput: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 35,
  },

  techniquesSection: {
    borderTopWidth: 1,
    borderTopColor: '#293048',
    paddingTop: 15,
  },

  techniquesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15,
  },

  sectionLabel: {
    color: '#a5a5a5',
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 0,
  },

  techniqueButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  techniqueBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#a5a5a5',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 32,
    alignItems: 'center',
  },

  techniqueBtnText: {
    color: '#a5a5a5',
    fontWeight: '600',
    fontSize: 12,
  },

  techniqueBtnActiveRp: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },

  techniqueBtnActiveDs: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },

  techniqueBtnActiveP: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },

  techniqueConfig: {
    marginTop: 15,
    backgroundColor: '#293048',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#373c56',
  },

  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  configLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  configActions: {
    flexDirection: 'row',
    gap: 5,
  },

  miniBtn: {
    backgroundColor: '#373c56',
    borderRadius: 4,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  miniBtnText: {
    color: '#a5a5a5',
    fontSize: 14,
    fontWeight: 'bold',
  },

  rpSeries: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#373c56',
  },

  rpSeriesLabel: {
    color: '#a5a5a5',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },

  rpControls: {
    flexDirection: 'row',
    gap: 10,
  },

  rpField: {
    flex: 1,
    flexDirection: 'column',
    gap: 5,
  },

  miniLabel: {
    color: '#a5a5a5',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },

  miniInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#373c56',
    borderRadius: 4,
    height: 32,
    position: 'relative',
  },

  miniControlBtn: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 32,
    zIndex: 1,
  },

  miniControlBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'normal',
  },

  miniInput: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#FFFFFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    paddingHorizontal: 28,
  },

  dsDrop: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#373c56',
  },

  dsDropLabel: {
    color: '#a5a5a5',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },

  dsControls: {
    flexDirection: 'row',
    gap: 10,
  },

  dsField: {
    flex: 1,
    flexDirection: 'column',
    gap: 5,
  },

  pControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 15,
  },

  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 0,
  },

  actionBtnPrimary: {
    backgroundColor: '#2979ff',
  },

  actionBtnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  headerSection: {
    marginBottom: 24,
    marginTop: 20,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  dayIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(100, 181, 246, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  dayText: {
    color: "#64B5F6",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },

  actionLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },

  mainTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    lineHeight: 28,
  },

  button: {
    backgroundColor: "#2979FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  
  startSessionButton: {
    backgroundColor: "#4CAF50",
    marginTop: 10,
  },

  disabledButton: {
    backgroundColor: "#A5A5A5",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  emptyText: {
    color: "#A5A5A5",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
  },
  emptySubtext: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});