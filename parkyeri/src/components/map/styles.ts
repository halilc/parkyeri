import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  callout: {
    padding: 15,
    minWidth: 150,
    backgroundColor: 'white',
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  legend: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'column',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
}); 