/**
 * Base repository interface that defines common CRUD operations
 */
export interface IBaseRepository<T, ID> {
  /**
   * Get all entities
   * @param forceRefresh Whether to force a refresh from API instead of using cache
   */
  getAll(forceRefresh?: boolean): Promise<T[]>;
  
  /**
   * Get an entity by ID
   * @param id Entity identifier
   * @param forceRefresh Whether to force a refresh from API instead of using cache
   */
  getById(id: ID, forceRefresh?: boolean): Promise<T | null>;
  
  /**
   * Save an entity (create or update)
   * @param entity Entity to save
   */
  save(entity: T): Promise<T>;
  
  /**
   * Delete an entity by ID
   * @param id Entity identifier
   */
  delete(id: ID): Promise<boolean>;
}